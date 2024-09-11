// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
import axios from 'axios';

// const app = express();

// const server = createServer(app);

// const io = new Server(server, {
//     cors: { origin: "*" }
// });

// const authenticateSocket = async (socket, next) => {
//     const token = socket.handshake.auth.token;
//     if (!token) {
//       return next(new Error('Unauthorized'));
//     }

//     try {
//         const response = await axios.get('http://localhost:8000/auth/token/verify', {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });
//         if (response.status === 200) {
//           next();
//         } else {
//           next(new Error('Unauthorized'));
//         }
//       } catch (error) {
//         next(new Error('Unauthorized'));
//       }
//     };

//   io.use(authenticateSocket);

// io.on('connection', (socket) => {
//     //console.log( socket.client.conn.server.clientsCount + " users connected" );
//     socket.on('sendChatToServer', async (message) => {
//         if(socket.connected)
//         {
//             socket.broadcast.emit('sendChatToClient', message);
//             console.log(message);
//         }
//         else
//         {
//             console.log("message send failed");
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('Disconnect');
//     });
// });

// server.listen(3000, () => {
//     console.log('Server is running');
// });


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
