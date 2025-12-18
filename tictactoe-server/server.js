const express = require('express');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const { Server } = require('socket.io');
const crypto = require('crypto');
const { timeStamp } = require('console');

const PORT = 5001;
const REACT_ORIGIN = "http://localhost:5173";
// const REACT_ORIGIN = "http://localhost:4173";
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
    }
});

io.on('connection', socket => {
    socket.on('createRoom', data => handleCreateRoom(socket, data));
    socket.on('joinRoom', data => handleJoinRoom(socket, data));
    socket.on('startGame', data => handleStartGame(socket, data));
    socket.on('chatMessage', data => handleChatMessage(socket, data));
    socket.on('deployFail', data => handleDeployFail(socket, data));
    socket.on('deploySuccess', data => handleDeploySuccess(socket, data));
    socket.on('submitMove', data => handleSubmitMove(socket, data));
    socket.on('moveFail', data => handleMoveFail(socket, data));
    socket.on('moveSuccess', data => handleMoveSuccess(socket, data));
    socket.on('restartGame', data => handleRestartGame(socket, data));

    // socket.on('disconnect', () => {
    //     // for later
    // })
})

// // Error formatter
// app.use((err, _req, res, _next) => {
//     res.status(err.status || 500);
//     console.error(err);
//     res.json({
//         // title: err.title || 'Server Error',
//         message: err.message,
//         statusCode: err.status,
//         errors: err.errors,
//         stack: isProduction ? null : err.stack
//     });
// });


// app.get('/', (req, res) => {
//     // res.send("TicTacToe lobby connected.");
//     console.log("this prints")

// });

server.listen(PORT, () => {
    console.log(`Lobby server listening on ${PORT}`);
});

// app.listen(5000, () => {
//     console.log(`Lobby socketIo server listening on port ${PORT}`);
// });

function handleCreateRoom(socket, data) {
    const roomId = crypto.randomBytes(3).toString('hex');
    const { userAddress } = data;

    const room = {
        creator: userAddress,
        joiner: null,
        status: 'WAITING',
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
    const message = `[SYSTEM]: Player X (${room.creator.slice(0, 8)}) is starting the game. Creating a smart contract...`;
    io.to(roomId).emit('creatingGame');
    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message, timeStamp: Date.now() })
}

function handleChatMessage(socket, data) {
    const { roomId, sender, message } = data;
    if (!rooms[ roomId ]) return;

    // check for if sender is in the room
    if (socket.id !== rooms[ roomId ].creatorSocketId && socket.id !== rooms[ roomId ].joinerSocketId) {
        return;
    };

    io.to(roomId).emit('announcement', {
        sender: sender,
        message: message,
        timestamp: Date.now(),
    });
}

function handleDeployFail(socket, data) {
    const { roomId } = data;
    if (socket.id !== rooms[ roomId ].creatorSocketId && socket.id !== rooms[ roomId ].joinerSocketId) {
        return;
    };

    io.to(roomId).emit('deployFail');
    io.to(roomId).emit('announcement', {
        sender: 'SYSTEM',
        message: "[ERROR]: Contract deployment failed. Please try again.",
        timestamp: Date.now()
    });

};

function handleDeploySuccess(socket, data) {
    const { roomId, newGameAddress } = data;
    rooms[ roomId ].gameContractAddress = newGameAddress;

    io.to(roomId).emit('deploySuccess', { newGameAddress });
};

function handleSubmitMove(socket, data) {
    const { roomId, r, c, walletAddress } = data;
    io.to(roomId).emit('announcement', {
        sender: 'SYSTEM',
        message: `[SYSTEM]: ${walletAddress.slice(0, 8)} has submitted Move(Row: ${r}, Column: ${c}), waiting for transaction to be validated by the blockchain ...`,
        timestamp: Date.now()
    });
};

function handleMoveFail(socket, data) {
    const { roomId } = data;
    io.to(roomId).emit('announcement', {
        sender: 'SYSTEM',
        message: '[SYSTEM]: Transaction failed, please try again.',
        timestamp: Date.now()
    })
};

function handleMoveSuccess(socket, data) {
    const { r, c, roomId, walletAddress, nextPlayer, newBoard, winner } = data;
    io.to(roomId).emit('moveSuccess', { walletAddress, nextPlayer, newBoard, winner });
    io.to(roomId).emit('announcement', {
        sender: 'SYSTEM',
        message: `[SYSTEM]: Transaction successful. ${walletAddress.slice(0, 8)} made a move at (${r}, ${c}).`,
        timestamp: Date.now()
    });
};

function handleRestartGame(socket, data) {
    const { roomId, nextPlayer } = data;

    io.to(roomId).emit('restartGame', { nextPlayer });

    io.to(roomId).emit('announcement', {
        sender: 'SYSTEM',
        message: `Game has been successfully restarted. ${nextPlayer.slice(0, 8)} moves first`,
        timestampe: Date.now()
    });
}
