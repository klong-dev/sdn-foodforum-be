const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    phone_number: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user',
    },
}, { timestamps: true });

userSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);