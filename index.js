// 1. Environment setup
require('dotenv').config();

// 2. Core Node modules
const path = require('path');
const http = require('http');

// 3. Third-party modules
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser'); // (optional, if you use express.json instead)
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const socketio = require('socket.io');

// 4. Your own modules
const routes = require('./src/routes/index');
const socketService = require('./src/services/socketService');
const { connectDB } = require('./src/config/database.config');

// 5. App initialization
const app = express();
const PORT = process.env.PORT;
const server = http.createServer(app);

// 6. Database connection
connectDB();

// 7. Socket.io setup
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});
const socketHandler = socketService(io);
app.set('socketHandler', socketHandler);

// 8. Global middleware
app.use(helmet());
// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: 'Too many requests from this IP, please try again later.'
// }));
app.use(morgan('dev'));

const corsOptions = {
    origin: function (origin, callback) {
        const allowedDomains = [
            'http://localhost:8000',
            'http://localhost:3001',
            process.env.CLIENT_URL
        ].filter(Boolean);
        if (!origin || allowedDomains.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 9. Routes
app.use('/', routes);

// 10. 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: '404 - Page Not Found' });
});

// 11. Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '500 - Internal Server Error' });
});

// 12. Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});