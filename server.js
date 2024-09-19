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
            const savedMessage = response.data;

            socket.emit('sendChatToClient', savedMessage);
            socket.broadcast.emit('sendChatToClient', savedMessage);

            console.log('Message stored successfully!');
        } else {
            console.error('Error storing message:', response.status);
        }
    });

    // Server-side code
    socket.on('deleteMessage', (messageId) => {
        console.log("delete message event",messageId);
        io.emit('deleteMessage', messageId);
        io.emit('updateGroupMessages', messageId);
    });

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});


server.listen(3000, () => {
    console.log('Server is running');
});
