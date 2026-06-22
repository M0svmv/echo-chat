const app = require('./app');
const connectDB = require('./config/db.config');
const http = require('http');
const initSocket = require('./io.socket'); // استدعاء مدير السوكيت

const PORT = process.env.PORT || 5000;


connectDB();


const server = http.createServer(app);


const { io, onlineUsers } = initSocket(server);


app.set('io', io);
app.set('onlineUsers', onlineUsers);


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});