const userService = require('../services/user');
const User = require('../models/users.model');
const bcrypt = require('bcrypt');
const FriendRequest = require('../models/friendRequest');

exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        console.log('updateUser');
        // Chỉ cho phép user update chính mình hoặc admin update bất kỳ ai
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Bạn chỉ có thể cập nhật thông tin của chính mình.' });
        }
        const currentUser = await userService.getUserById(req.params.id);
        if (!currentUser) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        // Không cho phép cập nhật password qua API này
        const userData = { ...currentUser.toObject(), ...req.body };
        if ('password' in userData) {
            delete userData.password;
        }
        console.log('userData: ', userData);
        const updatedUser = await userService.updateUser(req.params.id, userData);
        console.log('updatedUser: ', updatedUser);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        // Log user ID from the token
        console.log('User ID from token:', req.user.id);

        const user = await userService.getUserById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Log entire user object to debug
        console.log('User from database:', JSON.stringify(user, null, 2));

        // Return all user fields except password
        const userProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone_number: user.phone_number,
            role: user.role,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json(userProfile);
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const avatarPath = `/uploads/${req.file.filename}`;
        const updatedUser = await userService.updateUser(req.user.id, { avatar: avatarPath });
        res.json({ message: 'Avatar updated successfully', avatar: avatarPath, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin-only: Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        // Only allow admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can change user status.' });
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'banned'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value.' });
        }
        const user = await userService.updateUser(id, { status });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all posts by the current user
exports.getCurrentUserPosts = async (req, res) => {
    try {
        const posts = await userService.getCurrentUserPosts(req.user.id);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;
        // Chỉ cho phép user đổi mật khẩu của chính mình hoặc admin đổi cho bất kỳ ai
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'Bạn chỉ có thể đổi mật khẩu của chính mình.' });
        }
        if (!newPassword || !oldPassword) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.' });
        }
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        // Nếu không phải admin thì phải kiểm tra oldPassword
        if (req.user.role !== 'admin') {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Mật khẩu cũ không đúng.' });
            }
        }
        // Hash mật khẩu mới
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendFriendRequest = async (req, res) => {
    try {
        const from = req.user.id;
        const { to } = req.body;
        if (from === to) {
            return res.status(400).json({ error: 'Không thể gửi lời mời kết bạn cho chính mình.' });
        }
        const user = await User.findById(from);
        const target = await User.findById(to);
        if (!user || !target) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        }
        // Đã là bạn bè
        if (user.friends.includes(to)) {
            return res.status(400).json({ error: 'Đã là bạn bè.' });
        }
        // Đã gửi lời mời chưa xử lý
        const existing = await FriendRequest.findOne({ from, to, status: 'pending' });
        if (existing) {
            return res.status(400).json({ error: 'Đã gửi lời mời kết bạn, vui lòng chờ xác nhận.' });
        }
        // Đã nhận lời mời từ người kia
        const reverse = await FriendRequest.findOne({ from: to, to: from, status: 'pending' });
        if (reverse) {
            return res.status(400).json({ error: 'Người này đã gửi lời mời cho bạn, hãy xác nhận.' });
        }
        const request = new FriendRequest({ from, to });
        await request.save();
        res.json({ message: 'Đã gửi lời mời kết bạn.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('userId: ', userId);
        // Lời mời nhận
        const received = await FriendRequest.find({ to: userId, status: 'pending' }).populate('from', 'username email avatar');
        console.log('received: ', received);
        // Lời mời đã gửi
        const sent = await FriendRequest.find({ from: userId, status: 'pending' }).populate('to', 'username email avatar');
        console.log('sent: ', sent);
        res.json({ received, sent });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ error: error.message });
    }
};

exports.respondFriendRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId, action } = req.body; // action: 'accept' | 'reject'
        const request = await FriendRequest.findById(requestId);
        if (!request || request.to.toString() !== userId) {
            return res.status(404).json({ error: 'Không tìm thấy lời mời kết bạn.' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Lời mời đã được xử lý.' });
        }
        if (action === 'accept') {
            // Thêm bạn bè cho cả hai
            const user = await User.findById(userId);
            const friend = await User.findById(request.from);
            if (!user.friends.includes(friend._id)) user.friends.push(friend._id);
            if (!friend.friends.includes(user._id)) friend.friends.push(user._id);
            await user.save();
            await friend.save();
            request.status = 'accepted';
            await request.save();
            return res.json({ message: 'Đã chấp nhận lời mời kết bạn.' });
        } else if (action === 'reject') {
            request.status = 'rejected';
            await request.save();
            return res.json({ message: 'Đã từ chối lời mời kết bạn.' });
        } else {
            return res.status(400).json({ error: 'Hành động không hợp lệ.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFriends = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('friends', 'username email avatar bio isOnline lastSeen');
        if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};