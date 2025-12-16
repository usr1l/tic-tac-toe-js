const express = require('express');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const { Server } = require('socket.io');
const crypto = require('crypto');

const PORT = 5001;
const REACT_ORIGIN = "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
const rooms = {};

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: REACT_ORIGIN }));

// if (!isProduction) {
// } else {
//     // need to fix this later
//     app.use(cors({ origin: "*" }));
// };

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// create the http server to wrap with scoket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: REACT_ORIGIN,
        methods: [ "GET", "POST" ],
        // credentials: true
    }
});

io.on('connection', socket => {
    // console.log("User connected:")
    socket.on('createRoom', data => handleCreateRoom(socket, data));
    socket.on('joinRoom', data => handleJoinRoom(socket, data));
    socket.on('startGame', data => handleStartGame(socket, data));
    socket.on('chatMessage', data => handleChatMessage(socket, data));

    // socket.on('disconnect', () => {
    //     // for later
    // })
})

// Error formatter
app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
        // title: err.title || 'Server Error',
        message: err.message,
        statusCode: err.status,
        errors: err.errors,
        stack: isProduction ? null : err.stack
    });
});


app.get('/', (req, res) => {
    // res.send("TicTacToe lobby connected.");
    console.log("this prints")

});

server.listen(PORT, () => {
    console.log(`Lobby server listening on ${PORT}`);
});

// app.listen(5000, () => {
//     console.log(`Lobby socketIo server listening on port ${PORT}`);
// });

function handleCreateRoom(socket, data) {
    const roomId = crypto.randomBytes(3).toString('hex');
    const { userAddress } = data;
    // console.log(userAddress, "this")
    const room = {
        // person who created the room
        creator: userAddress,
        // opponent
        joiner: null,
        // game creation status
        status: 'WAITING',
        //
        creatorSocketId: socket.id,
        joinerSocketId: null,
        gameContractAddress: null
    };

    rooms[ roomId ] = room;

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, creator: userAddress });
    const message = `[SYSTEM]: Room ${roomId} created. Waiting for opponent to join...`;

    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message, timestamp: Date.now() });
}

function handleJoinRoom(socket, data) {
    const { userAddress, roomId } = data;
    const room = rooms[ roomId ];

    if (!room || room.status !== 'WAITING' || room.creator.toLowerCase() === userAddress.toLowerCase()) {
        return socket.emit('joinError', { message: `Room ${roomId} not available.` });
    }

    room.joiner = userAddress;
    room.status = 'READY';
    room.joinerSocketId = socket.id;

    socket.join(roomId);
    io.to(roomId).emit('opponentJoinedRoom', { joiner: userAddress, roomId, creator: room.creator });

    const announcement = `[SYSTEM]: ${userAddress.slice(0, 8)} has joined the room. Waiting for ${room.creator.slice(0, 8)} to start the game.`;
    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message: announcement, timestamp: Date.now() });
}

function handleStartGame(socket, data) {
    const { roomId } = data;
    const room = rooms[ roomId ];

    if (!room || room.status !== 'READY' || socket.id !== room.creatorSocketId) {
        return socket.emit('error', { message: 'Not authorized to start the game.' });
    };

    room.status = 'PENDING';
    const announcement = `[SYSTEM]: Player X (${room.creator.slice(0, 8)}) is starting the game. Contract creation transaction sending to the blockchain...`;
    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message: announcement, timeStamp: Date.now() });
}

function handleChatMessage(socket, data) {
    const { roomId, sender, message } = data;
    if (!rooms[ roomId ]) return;

    // check for if sender is in the room
    if (socket.id !== rooms[ roomId ].creatorSocketId && socket.id !== rooms[ roomId ].joinerSocketId) {
        return;
    }

    io.to(roomId).emit('newMessage', {
        sender: sender,
        message: message,
        timestamp: Date.now(),
        // isCreator: sender.toLowerCase() === rooms[ roomId ].creator.toLowerCase()
    })
}
