const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const morgan = require('morgan');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const PORT = 5000;
const REACT_ORIGIN = "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";
const rooms = {};

const app = express();

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (!isProduction) {
    app.use(cors({ origin: REACT_ORIGIN }));
} else {
    // need to fix this later
    app.use(cors())
}

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(csurf({
    cookie: {
        secure: isProduction,
        sameSite: isProduction ? "Lax" : false,
        httpOnly: true
    }
}));

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

app.get('/api/csrf/token', (req, res) => {
    const token = req.csrfToken();
    res.status(200).json({ 'XSRF-Token': token });
});

app.listen(PORT, () => {
    console.log(`Lobby server listening on port ${PORT}`);
});
