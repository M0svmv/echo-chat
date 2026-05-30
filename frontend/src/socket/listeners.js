import socket from "./socket";
import store from "../app/store";
import { addMessage, setOnlineUsers } from "../features/chat/chatSlice";

// receive message
socket.on("getMessage", (msg) => {
  store.dispatch(addMessage(msg));
});

// online users
socket.on("onlineUsers", (users) => {
  store.dispatch(setOnlineUsers(users));
});