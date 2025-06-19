const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const session = require('express-session');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// CORS settings
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'food-forum-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Make user data available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    next();
});

// Routes
const routes = require('./src/routes/index');
const { connectDB } = require('./src/config/database.config');
app.use('/', routes);

// Connect to MongoDB
connectDB();

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});