const express = require('express');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const { Server } = require('socket.io');
const crypto = require('crypto');
const { timeStamp } = require('console');

const PORT = 5000;
const REACT_ORIGIN = "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";
const rooms = {};

const app = express();

app.use(morgan("dev"));
app.use(express.json());

if (!isProduction) {
    app.use(cors({ origin: REACT_ORIGIN }));
} else {
    // need to fix this later
    app.use(cors({ origin: "*" }));
};

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// create the http server to wrap with scoket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: REACT_ORIGIN,
        methods: [ "GET", "POST" ]
    }
});

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
    res.send("TicTacToe lobby connected.");
});

app.listen(PORT, () => {
    console.log(`Lobby server listening on port ${PORT}`);
});

function handleCreateRoom(socket, data) {
    const roomId = crypto.randomBytes(3).toString('hex');
    const { userAddress } = data;

    rooms[ roomId ] = {
        creator: userAddress,
        joiner: null,
        status: 'WAITING',
        creatorSocketId: socket.id,
        joinerSocketId: null,
        gameContractAddress: null
    };

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, creator: userAddress });
    const message = `[SYSTEM]: Room ${roomId} created. Waiting for opponent to join`;

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
    io.to(room.creatorSocketId).emit('opponentJoinedRoom', { joiner: userAddress });

    const announcement = `[SYSTEM]: Opponent ${userAddress} has joined the room.`; e
    io.to(roomId).emit('announcement', { sender: 'SYSTEM', messgae: announcement, timestamp: Date.now() });
}

function handleGameStart(socket, data) {
    const { roomId } = data;
    const room = rooms[ roomId ];

    if (!room || room.status !== 'READY' || socket.id !== room.creatorSocketId) {
        return socket.emit('error', { message: 'Requirements not met to start game.' });
    };

    room.status = 'PENDING';
    const announcement = `[SYSTEM]: Player X (${room.creator.slice(0, 8)}) is starting the game. Contract creation transaction sending to the blockchain...`;
    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message: announcement, timeStamp: Date.now() });
}

function handleChatMessage(socket, data) {
    const { roomId, sender, message } = data;
    if (!rooms[ roomId ]) return;

    if (socket.id !== rooms[ roomId ].creatorSocketId && socket.id !== rooms[ roomId ].joinerSocketId) {
        return;
    }
}
