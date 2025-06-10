const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const routes = require('./src/routes/index');
const { connectDB } = require('./src/config/database.config');
app.use('/', routes);

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});