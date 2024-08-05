import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

const app = express();

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

const authenticateSocket = async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
        const response = await axios.get('http://localhost:8000/api/auth/token/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          next();
        } else {
          next(new Error('Unauthorized'));
        }
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    };

  io.use(authenticateSocket);

io.on('connection', (socket) => {
    console.log('connection');
    console.log( socket.client.conn.server.clientsCount + " users connected" );
    socket.on('sendChatToServer', async (message) => {
        console.log(message);
        socket.connected ?? socket.broadcast.emit('sendChatToClient', message);
    });

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});

server.listen(3000, () => {
    console.log('Server is running');
});
