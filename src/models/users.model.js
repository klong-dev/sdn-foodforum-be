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
    status: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active',
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
    },
    bio: {
        type: String,
        default: '',
        trim: true,
        maxlength: [300, 'Bio cannot be more than 300 characters']
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    const payload = {
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

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

// Check if model already exists to prevent recompilation
module.exports = mongoose.models.User || mongoose.model('User', userSchema);