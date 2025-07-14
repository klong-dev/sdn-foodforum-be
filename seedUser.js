require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Dán lại userSchema của bạn ở đây
const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    avatar: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketId: { type: String, default: null }
}, { timestamps: true });

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

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedUsers() {
    await mongoose.connect(process.env.MONGODB_URI); // đổi thành DB của bạn

    const users = [
        { username: 'alice', email: 'alice@example.com', password: 'password123', role: 'user' },
        { username: 'bob', email: 'bob@example.com', password: 'password123', role: 'moderator' },
        { username: 'charlie', email: 'charlie@example.com', password: 'password123', role: 'user' },
        { username: 'david', email: 'david@example.com', password: 'password123', role: 'admin' },
        { username: 'eve', email: 'eve@example.com', password: 'password123', role: 'user' },
    ];

    try {
        await User.deleteMany({});
        for (let userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`User ${user.username} created`);
        }
    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedUsers();
