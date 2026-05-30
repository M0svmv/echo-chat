const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const corsOptions = require('./config/corsOptions.config');

const authRoutes = require('./modules/auth/auth.routes');
const conversationRoutes = require('./modules/chat/routes/conversation.routes');
const messageRoutes = require('./modules/chat/routes/message.routes');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/chats', conversationRoutes);
app.use('/api/messages', messageRoutes);

module.exports = app;