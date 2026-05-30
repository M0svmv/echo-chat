import app from './app.js';
import connectDB from './config/db.config.js';
import http from 'http';



const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
