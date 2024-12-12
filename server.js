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
        const response = await axios.post('http://127.0.0.1:8000/messages', msg);
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
    socket.on('deleteMessage', (message,isMove) => {
        console.log("delete message event", message);
        io.emit('deleteMessage', message,isMove);
        io.emit('updateGroupMessages', message);
    });

    socket.on('moveMessage', (moveMessages, newGroupId, groupId,uniqueId) => {
        io.emit('moveMessage', moveMessages, newGroupId, groupId,uniqueId);
    });

    socket.on('updateEditedMessage', (editedMessage) => {
        io.emit('updateEditedMessage', editedMessage);
    });

    socket.on('restoreMessage', (message,uniqueId) => {
        console.log("Restore message event", message,uniqueId);
        io.emit('restoreMessage', message,uniqueId);
    })

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});


server.listen(3000, () => {
    console.log('Server is running');
});
