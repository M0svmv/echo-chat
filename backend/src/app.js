const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');


const corsOptions = require('./config/corsOptions.config');

// Import Routes
const authRoutes = require('./modules/auth/auth.routes');
const conversationRoutes = require('./modules/chat/routes/conversation.routes');
const messageRoutes = require('./modules/chat/routes/message.routes');







dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  },
});

app.set('io', io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // تسجيل user
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // disconnect
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', conversationRoutes);
app.use('/api/messages', messageRoutes);




module.exports = app;