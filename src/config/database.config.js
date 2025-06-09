const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodforum';

// Auto require all models in models directory
const models = require('require-all')({
    dirname: __dirname + '/../models',
    filter: /(.+)\.model\.js$/,
    map: (name) => name.replace('.model', ''),
    resolve: (Model) => Model
});

// Function to connect to the database
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = {
    connectDB,
};