const userService = require('../services/user');

exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userService.getCurrentUserDetails(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User data retrieved successfully',
            user: user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to retrieve user data' });
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
        // Get the current user first
        const currentUser = await userService.getUserById(req.params.id);
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        // Merge existing user data with the updates from the request body
        const userData = { ...currentUser.toObject(), ...req.body };

        // Update with merged data
        const updatedUser = await userService.updateUser(req.params.id, userData);
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

// Favorite posts functionality
exports.addToFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        const user = await userService.addToFavorites(userId, postId);
        res.json({
            message: 'Post added to favorites successfully',
            favoritePost: user.favoritePost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeFromFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        const user = await userService.removeFromFavorites(userId, postId);
        res.json({
            message: 'Post removed from favorites successfully',
            favoritePost: user.favoritePost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFavoritePosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const favoritePosts = await userService.getUserFavoritePosts(userId);

        res.json({
            message: 'Favorite posts retrieved successfully',
            posts: favoritePosts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};