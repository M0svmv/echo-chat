# Socket.IO Review Report — Echo Chat

**Review Date:** May 31, 2026  
**Reviewer:** Full-Stack Real-Time Systems Engineer  
**Known Error:** `socket.js:3 GET http://localhost:5000/socket.io/?EIO=4&transport=polling&t=... 404 (Not Found)`

---

## 🔴 Root Cause Analysis

### Why is this error happening?

The Socket.IO client receives a **404 Not Found** error when attempting to connect to the Socket.IO endpoint at `http://localhost:5000/socket.io/`.

**Primary Cause: Two Different Server Objects**

The backend architecture has a critical structural flaw:

1. **app.js** creates a server and attaches Socket.IO to it, but only exports the Express app
2. **server.js** imports the app and creates a DIFFERENT HTTP server
3. The Socket.IO server from app.js is NEVER listened on
4. The server that's actually listening (from server.js) has NO Socket.IO attached

**Result:** When the frontend tries to connect to `localhost:5000/socket.io/`, that endpoint doesn't exist because the Socket.IO server isn't running on that port.

---

### Contributing Factors

- **No error logging** — Backend doesn't indicate that Socket.IO failed to start
- **Silent initialization** — Socket.IO is created but never started/listened
- **Module export confusion** — app.js exports the app instead of the server with Socket.IO
- **No CORS auth** — Socket.IO CORS config uses wildcard `*` but frontend sends `withCredentials: true`
- **No socket auth middleware** — No verification that connecting sockets are authenticated

---

### Affected Files

- [backend/src/app.js](backend/src/app.js) — Creates Socket.IO but doesn't export it
- [backend/src/server.js](backend/src/server.js) — Creates a new server without Socket.IO
- [frontend/src/socket/socket.js](frontend/src/socket/socket.js) — Tries to connect to non-existent endpoint

---

## Project Overview

Echo Chat is building a **real-time messaging system** using Socket.IO with:
- **Architecture** — Express backend + Socket.IO server for live chat events
- **Frontend Integration** — React components listening to socket events (messages, online users)
- **Event Flow** — Backend tracks online users, frontend emits/receives messages via sockets
- **Status** — Socket.IO server not running; endpoint unreachable; 404 error on every connection attempt

---

## File Inventory

### Backend Files
- [backend/src/app.js](backend/src/app.js) — Express app setup + Socket.IO initialization (BROKEN)
- [backend/src/server.js](backend/src/server.js) — HTTP server creation + startup (doesn't use Socket.IO)

### Frontend Files
- [frontend/src/socket/socket.js](frontend/src/socket/socket.js) — Socket.IO client initialization
- [frontend/src/socket/listeners.js](frontend/src/socket/listeners.js) — Global event listeners
- [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) — Socket event listeners in Chat component
- [frontend/src/components/MessageInput.jsx](frontend/src/components/MessageInput.jsx) — Socket event emission

### Config Files
- [backend/src/config/corsOptions.config.js](backend/src/config/corsOptions.config.js) — Express CORS (not Socket.IO)

---

## Connection Flow (As Implemented)

1. **Frontend App Load** (App.jsx)
   - No Socket.IO initialization happens in App.jsx
   - Socket is only imported when needed (lazy import in pages/components)

2. **User Navigates to Chat** 
   - Home.jsx component mounts
   - Imports socket.js (frontend/src/socket/socket.js)
   - Socket module executes: `io("http://localhost:5000", { withCredentials: true })`
   - Socket client attempts initial connection via WebSocket then polling fallback

3. **Connection Attempt** (Frontend)
   - Client tries WebSocket first (preferred)
   - Falls back to HTTP long-polling: `GET http://localhost:5000/socket.io/?EIO=4&transport=polling`
   - ❌ Gets 404 error because Socket.IO server is not listening on port 5000

4. **Backend Reality** (What's Actually Running)
   - server.js creates `const server = http.createServer(app)`
   - server.listen(5000) is called
   - But this server has NO Socket.IO attached
   - The Socket.IO server from app.js is abandoned (created but never started)

5. **Socket Listeners** (Never Reached)
   - listeners.js sets up socket event listeners (message receive, online users)
   - Home.jsx registers "connect" and "newMessage" listeners
   - MessageInput.jsx attempts to emit "test-message"
   - ❌ None of these listeners work because socket never connects

6. **Disconnect Handling** (Not Applicable)
   - Home.jsx attempts to clean up listeners on unmount
   - Never reaches the cleanup code because connection never succeeded

---

## Findings

### 🔴 CRITICAL — Backend Creates Socket.IO Server But Never Starts It

- **File:** [backend/src/app.js](backend/src/app.js) (lines 32-37) and [backend/src/server.js](backend/src/server.js) (entire file)
- **Category:** Server Setup | Connection Setup
- **Description:**
  - app.js creates an HTTP server and attaches Socket.IO to it (lines 32-37)
  - But then app.js only exports the Express app, not the server with Socket.IO
  - server.js imports the app and creates a COMPLETELY NEW HTTP server with `http.createServer(app)`
  - This new server in server.js is the one that listens on port 5000
  - The Socket.IO server (from app.js) is NEVER started
  - Result: Socket.IO endpoint doesn't exist on the listening server

- **Evidence:**
  ```javascript
  // app.js lines 32-37 (Socket.IO created HERE)
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: "*"
    },
  });
  
  // ... Socket.IO configured and events registered (lines 43-60) ...
  
  // app.js line 73 (But ONLY app is exported, not server!)
  module.exports = app;
  
  // server.js line 8 (NEW server created HERE, doesn't have Socket.IO!)
  const server = http.createServer(app);
  
  // server.js line 12 (THIS server is the one that listens)
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  ```

- **Recommendation:**
  - Export the HTTP server (with Socket.IO attached) from app.js instead of just the app
  - Import and listen on that server in server.js
  - Ensure the Socket.IO server and Express app are on the same HTTP server instance

---

### 🔴 CRITICAL — Socket.IO CORS Config Mismatch with Frontend

- **File:** [backend/src/app.js](backend/src/app.js) (line 35)
- **Category:** CORS | Connection Setup
- **Description:**
  - Socket.IO CORS config uses `origin: "*"` (wildcard, accepts all)
  - Frontend sends `withCredentials: true` in socket options
  - This combination is invalid: `credentials: true` with `origin: "*"` is rejected by browsers
  - Browser blocks connection with a CORS error (though currently hidden by the 404)
  - Even if Socket.IO server were running, connection would fail

- **Evidence:**
  ```javascript
  // app.js lines 34-37
  const io = new Server(server, {
    cors: {
      origin: "*"  // ⚠️ Wildcard
    },
  });
  
  // frontend socket.js line 4
  const socket = io("http://localhost:5000", {
    withCredentials: true,  // ⚠️ Conflicts with wildcard origin
  });
  ```

- **Recommendation:**
  - Change Socket.IO CORS to match frontend origin: `origin: "http://localhost:5173"`
  - OR: Remove `withCredentials: true` from frontend if cookies not needed
  - Best practice: Be explicit, don't use wildcard for credentials

---

### 🔴 CRITICAL — Socket Authentication Not Implemented

- **File:** [backend/src/app.js](backend/src/app.js) (lines 44-60)
- **Category:** Authentication | Server Setup
- **Description:**
  - Socket.IO connection handler does NOT verify the connecting user's JWT token
  - No middleware checking `auth` object from handshake
  - No verification that the user is authenticated before allowing connection
  - Any client can connect without a valid token
  - User identity (`addUser` event) is trusted from client input (could be spoofed)
  - Serious security issue: unauthenticated socket connections allowed

- **Evidence:**
  ```javascript
  // app.js lines 44-60 (NO authentication check!)
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
    // Trusts userId directly from client! No JWT validation
    socket.on("addUser", (userId) => {
      onlineUsers.set(userId, socket.id);
    });
  
    socket.on("disconnect", () => {
      // ...
    });
  });
  
  // frontend socket.js does NOT pass token:
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    // ❌ No auth token in handshake!
  });
  ```

- **Recommendation:**
  - Implement Socket.IO authentication middleware using `io.use()`
  - Extract JWT token from handshake `auth` object
  - Verify token before allowing connection
  - Attach user ID to socket object for later use
  - Reject unauthenticated connections with 401 error
  - Frontend must pass token in handshake: `auth: { token: accessToken }`

---

### 🟠 HIGH — Frontend Socket Never Receives Access Token from Redux

- **File:** [frontend/src/socket/socket.js](frontend/src/socket/socket.js) (entire file)
- **Category:** Authentication | Connection Setup
- **Description:**
  - Socket.js is executed at module load time (before Redux is available)
  - Socket connects immediately with NO access token in handshake
  - Redux auth store exists but socket doesn't read from it
  - Token can't be passed at connection time because socket is created before Redux state is hydrated
  - Socket needs to be recreated/authenticated after login

- **Evidence:**
  ```javascript
  // frontend socket.js (entire file)
  import { io } from "socket.io-client";
  
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    // ❌ No auth token passed
    // Redux store not accessible here (module load time)
  });
  
  export default socket;
  
  // Token exists in Redux but socket doesn't know about it:
  // store.getState()?.auth?.accessToken is available in Home.jsx
  // But socket.js is loaded BEFORE Redux is ready
  ```

- **Recommendation:**
  - Delay socket initialization until after login
  - Pass access token in auth object: `auth: { token: accessToken }`
  - Recreate/reconnect socket when token refreshes
  - Disconnect socket on logout

---

### 🟠 HIGH — No Socket Reconnection on Token Refresh

- **File:** [frontend/src/socket/socket.js](frontend/src/socket/socket.js) and [frontend/src/App.jsx](frontend/src/App.jsx)
- **Category:** Lifecycle | Authentication
- **Description:**
  - Socket connects once at app start
  - When access token refreshes in App.jsx useEffect, socket is NOT updated
  - Socket continues using old/invalid credentials
  - After 15 minutes (token expiry), socket will have invalid auth
  - Socket emits (like sending messages) could fail after token refresh

- **Evidence:**
  ```javascript
  // frontend App.jsx - Token refreshes but socket not updated:
  useEffect(() => {
    const refreshUser = async () => {
      const res = await api.post("/auth/refresh");
      dispatch(setCredentials({
        user: res.data.data.user,
        accessToken: res.data.data.accessToken,  // ✅ Redux updated
        // ❌ But socket not re-authenticated!
      }));
    };
    refreshUser();
  }, [dispatch]);
  ```

- **Recommendation:**
  - Emit socket reconnection after successful token refresh
  - Or: Recreate socket connection with new token
  - OR: Use socket authentication with dynamic token validation

---

### 🟠 HIGH — Frontend Socket Lifecycle Not Tied to Component Mounts

- **File:** [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) and [frontend/src/socket/listeners.js](frontend/src/socket/listeners.js)
- **Category:** Lifecycle | Code Quality
- **Description:**
  - Socket listeners registered in Home.jsx useEffect
  - Listeners NOT removed on component unmount (empty cleanup function)
  - Duplicate listeners registered on every Home.jsx mount
  - Socket connection is global/singleton, not tied to specific component lifetime
  - Could cause memory leaks if component mounts multiple times

- **Evidence:**
  ```javascript
  // frontend Home.jsx
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });
  
    socket.on("newMessage", (data) => {
      dispatch(addMessage(data.message));
    });
  
    return () => {
      socket.off("newMessage");  // ⚠️ Only clears newMessage, not "connect"!
    };
  }, []);  // Empty dependency array - runs once
  ```

- **Recommendation:**
  - Clear all listeners in cleanup function: `socket.off("connect")` and `socket.off("newMessage")`
  - OR: Use named listener functions and remove specific functions
  - Consider disconnecting socket on component unmount (if appropriate)

---

### 🟠 HIGH — No Error Handling for Socket Connection Failures

- **File:** [frontend/src/socket/socket.js](frontend/src/socket/socket.js) and [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
- **Category:** Code Quality | Lifecycle
- **Description:**
  - Socket.IO client configured with no error handlers
  - No `connect_error` event listener in frontend
  - No `disconnect` event listener in frontend
  - Connection failures (like 404) silently fail
  - User has no indication that socket failed to connect
  - Message sending might fail without user knowing

- **Evidence:**
  ```javascript
  // frontend socket.js - No error handling
  const socket = io("http://localhost:5000", {
    withCredentials: true,
  });
  // ❌ No .on("connect_error"), .on("disconnect"), .on("error")
  
  // frontend Home.jsx - Only listens to "connect" and "newMessage"
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);  // Only logs success
  });
  // ❌ No error handling for when connect fails
  ```

- **Recommendation:**
  - Listen to `connect_error` event and log errors
  - Listen to `disconnect` event to handle reconnection
  - Provide user feedback when socket fails (toast notification, UI indicator)
  - Implement exponential backoff reconnection strategy

---

### 🟡 MEDIUM — Socket.IO Transport Order Not Optimized

- **File:** [frontend/src/socket/socket.js](frontend/src/socket/socket.js) (line 3)
- **Category:** Connection Setup
- **Description:**
  - Socket.IO client defaults to trying WebSocket first, then fallback to polling
  - This is good for stability but polling (HTTP long-polling) is much slower
  - For real-time chat, WebSocket is strongly preferred
  - No explicit transport selection means relying on defaults
  - Browser console shows polling attempt even though WebSocket is available

- **Evidence:**
  ```javascript
  // frontend socket.js
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    // ⚠️ No explicit transport: ['websocket', 'polling']
  });
  // Uses Socket.IO default which includes polling
  ```

- **Recommendation:**
  - Explicitly set transport order: `transports: ['websocket', 'polling']`
  - This ensures WebSocket is preferred, polling is fallback
  - Better for real-time performance

---

### 🟡 MEDIUM — Event Names Are Magic Strings (Not Constants)

- **File:** [backend/src/app.js](backend/src/app.js) (lines 48, 53) and [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) (lines 15, 20) and [frontend/src/components/MessageInput.jsx](frontend/src/components/MessageInput.jsx) (line 27)
- **Category:** Code Quality
- **Description:**
  - Event names are hardcoded strings: `"addUser"`, `"disconnect"`, `"newMessage"`, `"test-message"`
  - No centralized event name constants
  - If event name is mistyped, no error is raised (silently fails)
  - If backend changes event name, frontend listeners don't automatically update
  - Makes refactoring and maintenance harder

- **Evidence:**
  ```javascript
  // backend app.js
  socket.on("addUser", (userId) => { ... });  // Magic string
  socket.on("disconnect", () => { ... });     // Magic string
  
  // frontend Home.jsx
  socket.on("newMessage", (data) => { ... });  // Magic string
  
  // frontend MessageInput.jsx
  socket.emit("test-message", { ... });        // Magic string
  ```

- **Recommendation:**
  - Create a shared constants file: `src/constants/socketEvents.js`
  - Define all event names as constants: `SOCKET_EVENTS = { ADD_USER: "addUser", NEW_MESSAGE: "newMessage", ... }`
  - Use constants everywhere instead of magic strings
  - Single source of truth for event names

---

### 🟡 MEDIUM — Socket CORS Credentials Mismatch Creates Browser Security Block

- **File:** [backend/src/app.js](backend/src/app.js) (line 35) and [frontend/src/socket/socket.js](frontend/src/socket/socket.js) (line 4)
- **Category:** CORS | Connection Setup
- **Description:**
  - Express CORS (corsOptions.config.js) is configured for credentials (for HTTP endpoints)
  - Socket.IO CORS configured with wildcard `origin: "*"` (no credentials support)
  - Frontend sends `withCredentials: true` to Socket.IO
  - Browser enforces CORS policy: if credentials are sent, origin must be explicit (not wildcard)
  - Even if Socket.IO server were running, browser would reject the connection
  - Credentials can't be sent with wildcard origins per browser security policy

- **Evidence:**
  ```javascript
  // app.js line 35 (Socket.IO wildcard CORS)
  const io = new Server(server, {
    cors: {
      origin: "*"  // ⚠️ Wildcard
    },
  });
  
  // socket.js line 4 (Frontend sends credentials)
  const socket = io("http://localhost:5000", {
    withCredentials: true,  // ⚠️ Conflicts with wildcard
  });
  
  // corsOptions.config.js (Express CORS is correct)
  const corsOptions = {
    origin: "http://localhost:5173",  // ✅ Explicit
    credentials: true  // ✅ Matches frontend
  };
  ```

- **Recommendation:**
  - Set Socket.IO CORS origin to match frontend: `origin: "http://localhost:5173"`
  - Add `credentials: true` to Socket.IO CORS config
  - Ensure both are explicit, not wildcards

---

### 🟡 MEDIUM — No Socket Connection State Tracking in Redux

- **File:** [frontend/src/features/auth/authSlice.js](frontend/src/features/auth/authSlice.js)
- **Category:** Frontend | Code Quality
- **Description:**
  - Redux tracks auth state (user, token, initialized)
  - But doesn't track socket connection state
  - No Redux indicator for "is socket connected?"
  - Components can't easily check if they should display real-time features
  - If socket fails to connect, components don't know and might attempt to emit events

- **Evidence:**
  ```javascript
  // Redux authSlice only tracks auth, not socket:
  const initialState = {
    user: null,
    accessToken: null,
    initialized: false,
    // ❌ No socketConnected: boolean
  };
  
  // Components can't check:
  // if (!socketConnected) return <ConnectionError />
  ```

- **Recommendation:**
  - Add socket connection state to Redux or a separate socket slice
  - Update state on socket `connect` and `disconnect` events
  - Components can conditionally render based on socket state
  - UI can show "disconnected" warning if socket fails

---

### 🟡 MEDIUM — Message Event Data Structure Mismatch

- **File:** [backend/src/app.js](backend/src/app.js) (no message event handler) and [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) (line 20)
- **Category:** Code Quality
- **Description:**
  - Backend app.js has no "newMessage" event emitter visible
  - Frontend Home.jsx listens for "newMessage" expecting `data.message` structure
  - No guarantee backend will send the expected format
  - If backend emits different structure, frontend dispatch fails silently
  - Unclear which component should send/receive messages (chat module not fully reviewed)

- **Evidence:**
  ```javascript
  // frontend Home.jsx line 20
  socket.on("newMessage", (data) => {
    dispatch(addMessage(data.message));  // ⚠️ Expects data.message structure
  });
  
  // backend app.js (NO visible message event handler to send this!)
  // Where does "newMessage" get emitted? Not in app.js...
  ```

- **Recommendation:**
  - Define clear message event schema (contract between backend and frontend)
  - Document expected data structure for each socket event
  - Add error handling if data structure doesn't match expectations
  - Verify backend actually emits "newMessage" events (might be in modules/chat)

---

### 🔵 LOW — Socket.IO Reconnection Strategy Not Configured

- **File:** [frontend/src/socket/socket.js](frontend/src/socket/socket.js) (line 3)
- **Category:** Connection Setup
- **Description:**
  - Socket.IO has default reconnection strategy (3 attempts with exponential backoff)
  - No explicit configuration means relying on defaults
  - Could be improved for chat application (more aggressive reconnection)
  - No visibility into reconnection attempts

- **Evidence:**
  ```javascript
  // frontend socket.js - Uses Socket.IO defaults
  const socket = io("http://localhost:5000", {
    withCredentials: true,
    // ❌ No reconnection config:
    // reconnection: true,
    // reconnectionDelay: 1000,
    // reconnectionDelayMax: 5000,
    // reconnectionAttempts: Infinity,
  });
  ```

- **Recommendation:**
  - Consider explicit reconnection settings for better control
  - For chat: more attempts, longer delays acceptable
  - Log reconnection attempts for debugging

---

### 🔵 LOW — Console.log Statements in Socket Event Handlers

- **File:** [backend/src/app.js](backend/src/app.js) (lines 45, 60) and [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) (line 14)
- **Category:** Code Quality
- **Description:**
  - Backend logs user connected/disconnected (reasonable for debugging)
  - Frontend logs socket connection status
  - These should be replaced with structured logging or removed in production
  - May interfere with performance in high-volume scenarios

- **Evidence:**
  ```javascript
  // backend app.js lines 45, 60
  console.log("User connected:", socket.id);
  console.log("User disconnected:", socket.id);
  
  // frontend Home.jsx line 14
  console.log("Socket connected:", socket.id);
  ```

- **Recommendation:**
  - Use structured logging library (e.g., winston, pino) instead of console.log
  - Set log levels (debug, info, warn, error)
  - Disable debug logs in production

---

### ⚪ INFO — Socket Cleanup in Component Unmount (Partial)

- **File:** [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) (line 23)
- **Category:** Lifecycle
- **Description:**
  - Home.jsx does attempt to clean up socket listener on unmount
  - Only clears the "newMessage" listener, not "connect"
  - Better than no cleanup, but incomplete
  - ✅ Good practice partially implemented

- **Evidence:**
  ```javascript
  // frontend Home.jsx
  return () => {
    socket.off("newMessage");  // ✅ Partial cleanup
  };
  ```

---

### ⚪ INFO — Disconnect Handler Properly Removes User from Online Map

- **File:** [backend/src/app.js](backend/src/app.js) (lines 53-60)
- **Category:** Server Setup | Code Quality
- **Description:**
  - Backend properly removes user from onlineUsers map on disconnect
  - Searches by socket ID to find and delete the user
  - Prevents ghost entries in online users list
  - ✅ Good practice confirmed

- **Evidence:**
  ```javascript
  // backend app.js lines 53-60
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);  // ✅ Proper cleanup
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
  ```

---

### ⚪ INFO — HTTP-Only Cookies Enabled for CORS

- **File:** [backend/src/config/corsOptions.config.js](backend/src/config/corsOptions.config.js)
- **Category:** CORS | Authentication
- **Description:**
  - Express CORS config includes `credentials: true`
  - Allows HTTP-only refresh token cookie to be sent with API requests
  - ✅ Good practice for auth system (though Socket.IO CORS doesn't match)

- **Evidence:**
  ```javascript
  // corsOptions.config.js
  const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true  // ✅ Allows cookies
  };
  ```

---

## Summary Table

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | BLOCKING |
| 🟠 High | 3 | BLOCKING |
| 🟡 Medium | 5 | ACTIONABLE |
| 🔵 Low | 1 | IMPROVEMENT |
| ⚪ Info | 2 | OK |
| **Total** | **14** | **6 BLOCKING** |

---

## Overall Assessment

The Socket.IO implementation has a **critical architectural flaw** that prevents the server from running at all: the Socket.IO server is created in app.js but the actual listening server is created in server.js without Socket.IO attached. This is why clients receive 404 errors. Additionally, there is no authentication middleware for socket connections, CORS configuration conflicts between Express and Socket.IO, and poor lifecycle management of socket connections. The system cannot function until the server architecture is fixed.

---

## Priority Fix List

Ordered by what will fix the 404 error first:

### Phase 1: Critical Fixes (Unblock Socket Connectivity)
1. **Export HTTP server with Socket.IO from app.js** — Not just the Express app
2. **Import and listen on that server in server.js** — Use the server that has Socket.IO attached
3. **Fix Socket.IO CORS config** — Match frontend origin (localhost:5173), not wildcard
4. **Implement socket authentication middleware** — Verify JWT token on connection

### Phase 2: Security & Auth (Before Production)
5. **Pass access token in socket handshake** — Add `auth: { token }` to frontend socket options
6. **Validate token in Socket.IO middleware** — Reject unauthenticated connections
7. **Disconnect socket on logout** — Clean up socket when user logs out
8. **Reconnect socket on token refresh** — Update socket credentials when access token refreshes

### Phase 3: Reliability & UX (Before Beta)
9. **Add connect_error event handler** — Handle and display connection failures
10. **Add disconnect event handler** — Detect disconnections and show UI feedback
11. **Implement proper listener cleanup** — Remove all listeners on unmount
12. **Add socket connection state to Redux** — Track socket status in store

### Phase 4: Code Quality & Maintenance (Before v1.0)
13. **Define socket event name constants** — Replace magic strings
14. **Implement socket event schema validation** — Ensure data structures match
15. **Set explicit transport order** — Prefer WebSocket over polling
16. **Replace console.log with structured logging** — Use logging library
17. **Configure reconnection strategy** — Set explicit reconnection parameters

---

## Deployment Checklist

- [ ] Move Socket.IO initialization to export from app.js
- [ ] Use exported server (with Socket.IO) in server.js
- [ ] Update Socket.IO CORS: `origin: "http://localhost:5173"` (or production URL)
- [ ] Add `credentials: true` to Socket.IO CORS
- [ ] Remove wildcard `*` from Socket.IO CORS
- [ ] Implement Socket.IO authentication middleware with JWT verification
- [ ] Implement socket disconnect on logout
- [ ] Pass access token in socket handshake `auth: { token }`
- [ ] Frontend: add error handling for connect_error events
- [ ] Frontend: add disconnect event handler
- [ ] Frontend: complete listener cleanup on component unmount
- [ ] Define event name constants in shared file
- [ ] Add socket connection state to Redux
- [ ] Test socket connection after backend server starts
- [ ] Test WebSocket connection (verify no polling fallback needed)
- [ ] Test disconnect and reconnection handling
- [ ] Load test socket connections (how many concurrent users?)
- [ ] Test socket events with real messages
- [ ] Verify auth tokens work with socket connections

---

## Conclusion

The 404 error is a symptom of a broken backend architecture where two different HTTP server objects are created — one has Socket.IO but never runs, the other runs but has no Socket.IO. Fixing this requires exporting the Socket.IO-equipped server from app.js and using it in server.js. After that, authentication, CORS configuration, and connection lifecycle management must be implemented for a production-ready system.

**Time to Fix:**
- Phase 1 (unblock): 1-2 hours
- Phase 2 (secure): 2-3 hours
- Phase 3 (reliable): 3-4 hours
- Phase 4 (quality): 4-6 hours
- **Total: 10-15 hours** for production-ready Socket.IO

