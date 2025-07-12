const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const models = require('require-all')({
    dirname: __dirname + '/../models',
    filter: /(.+)\.model\.js$/,
    map: (name) => name.replace('.model', ''),
    resolve: (Model) => Model
});

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = {
    connectDB,
};