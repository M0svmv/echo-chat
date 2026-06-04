const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const corsOptions = require('./config/corsOptions.config');

const authRoutes = require('./modules/auth/auth.routes');
const conversationRoutes = require('./modules/chat/routes/conversation.routes');
const messageRoutes = require('./modules/chat/routes/message.routes');
const friendsRoutes = require('./modules/friends/routes/friends.routes');



const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/chats', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendsRoutes);

module.exports = app;