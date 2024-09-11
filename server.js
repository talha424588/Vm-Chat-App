
import axios from 'axios';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('connection');

    socket.on('sendChatToServer', async (msg) => {
        console.log("message details", msg);
        const response = await axios.post('http://localhost:8000/messages', msg);
        console.log("resposer", response);
        if (response.status == 201) {
            const savedMessage = response.data; // The saved message with the generated ID

            // Emit the saved message (including the ID) back to the sender and broadcast to others
            socket.emit('sendChatToClient', savedMessage);
            socket.broadcast.emit('sendChatToClient', savedMessage);

            console.log('Message stored successfully!');
        } else {
            console.error('Error storing message:', response.status);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});

server.listen(3000, () => {
    console.log('Server is running');
});
