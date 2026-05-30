import app from './app.js';
import connectDB from './config/db.config.js';

import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

const onlineUsers = new Map();

app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);

    console.log('Online Users:', [...onlineUsers]);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log('🔴 User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});