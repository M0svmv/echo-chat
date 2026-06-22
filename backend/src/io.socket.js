const { Server } = require('socket.io');
const registerConversationHandlers = require('./modules/chat/sockets/conversation.socket');

const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    socket.on('addUser', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId); 
      socket.userId = userId; 
      console.log('Online Users count:', onlineUsers.size);
    });

   
    registerConversationHandlers(io, socket);

    
   

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      console.log('🔴 User disconnected:', socket.id);
    });
  });

  return { io, onlineUsers };
};

module.exports = initSocket;