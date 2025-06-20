const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path')

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//Config EJS
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'src', 'views'))

app.use(express.static(path.join(__dirname, 'public')));

//==============================================================

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser

// Routes
const routes = require('./src/routes/index');
const { connectDB } = require('./src/config/database.config');
app.use('/', routes);

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});