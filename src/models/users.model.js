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
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user',
    },
   avatar: {
        type: String,
        default: null
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    socketId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

userSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret.password;
        return ret;
    }
});

// Update online status
userSchema.methods.setOnline = async function (socketId) {
    this.isOnline = true;
    this.socketId = socketId;
    this.lastSeen = new Date();
    return await this.save();
};

userSchema.methods.setOffline = async function () {
    this.isOnline = false;
    this.socketId = null;
    this.lastSeen = new Date();
    return await this.save();
};


module.exports = mongoose.model('User', userSchema);