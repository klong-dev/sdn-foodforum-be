const userService = require('../services/user');

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

exports.getProfile = async (req, res) => {
    try {
        // If no ID is provided, show the current user's profile
        const userId = req.params.id || req.session?.user?.id;

        if (!userId) {
            return res.redirect('/auth/login');
        }

        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).render('error', {
                title: 'User Not Found',
                message: 'The user profile you are looking for does not exist.'
            });
        }

        // Check if this is the user's own profile
        const isOwnProfile = req.session?.user?.id === userId.toString();

        // In a real app, you would fetch this data from your database
        const userStats = {
            recipes: 3,
            posts: 5,
            comments: 12
        };

        // Example user content - in a real app, this would come from your database
        const userContent = {
            recipes: [
                {
                    id: 1,
                    title: 'Homemade Pasta Carbonara',
                    description: 'A creamy classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.',
                    image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?q=80&w=500&auto=format&fit=crop',
                    time: '30 mins',
                    rating: 4.8,
                    views: 234
                },
                {
                    id: 2,
                    title: 'Stone-Baked Pizza Margherita',
                    description: 'The perfect pizza with a crispy base, tangy tomato sauce, fresh mozzarella, and basil.',
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=500&auto=format&fit=crop',
                    time: '45 mins',
                    rating: 4.7,
                    views: 192
                }
            ],
            posts: [
                {
                    id: 1,
                    title: 'Best way to store fresh herbs?',
                    content: 'I always struggle to keep my herbs fresh. Any tips on how to make them last longer?',
                    category: 'Cooking Tips',
                    postedAt: '2 days ago',
                    replies: 14
                },
                {
                    id: 2,
                    title: 'Cast iron vs. non-stick pans?',
                    content: 'I\'m looking to invest in some quality cookware. Which type of pan do you recommend and why?',
                    category: 'Kitchen Equipment',
                    postedAt: '4 days ago',
                    replies: 23
                }
            ],
            comments: [
                {
                    id: 1,
                    postId: 3,
                    postTitle: 'Thai Green Curry Recipe',
                    content: 'I tried this recipe and it was delicious! I added some extra chili for more heat.',
                    postedAt: '1 week ago'
                },
                {
                    id: 2,
                    postId: 4,
                    postTitle: 'Best Bread Machine?',
                    content: 'I have the same model and agree with everything in this review. Worth every penny!',
                    postedAt: '2 weeks ago'
                }
            ],
            saved: isOwnProfile ? [
                {
                    id: 1,
                    title: 'Homemade Sourdough Bread',
                    description: 'The most authentic sourdough recipe with detailed instructions for beginners.',
                    type: 'Recipe',
                    url: '/recipes/5'
                },
                {
                    id: 2,
                    title: 'Kitchen Organization Tips',
                    description: 'Great advice for keeping your kitchen organized and efficient.',
                    type: 'Post',
                    url: '/forum/post/7'
                }
            ] : []
        };

        res.render('users/profile', {
            title: `${user.username}'s Profile`,
            user,
            userStats,
            userContent,
            isOwnProfile
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred while loading the profile.'
        });
    }
};

exports.getEditProfilePage = async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            return res.redirect('/auth/login');
        }

        const user = await userService.getUserById(req.session.user.id);
        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('users/edit-profile', {
            title: 'Edit Profile',
            user
        });

    } catch (error) {
        console.error('Edit profile error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'An error occurred while loading the edit profile page.'
        });
    }
};

exports.updateProfileWeb = async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            return res.redirect('/auth/login');
        }

        const userId = req.session.user.id;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.redirect('/auth/login');
        }

        // Only include fields that already exist in the user model
        // This will only update username and email since those are the only safe fields in your model
        const safeUpdates = {
            username: req.body.username,
            email: req.body.email
        };

        // Handle password change if requested
        if (req.body.currentPassword && req.body.newPassword) {
            if (req.body.newPassword !== req.body.confirmPassword) {
                return res.render('users/edit-profile', {
                    title: 'Edit Profile',
                    user,
                    error: 'New passwords do not match'
                });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isPasswordValid) {
                return res.render('users/edit-profile', {
                    title: 'Edit Profile',
                    user,
                    error: 'Current password is incorrect'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

            // Add password to updates
            safeUpdates.password = hashedPassword;
        }

        // Update user information
        const updatedUser = await userService.updateUser(userId, safeUpdates);

        // Update session user data
        req.session.user = {
            ...req.session.user,
            username: updatedUser.username,
            email: updatedUser.email
        };

        res.render('users/edit-profile', {
            title: 'Edit Profile',
            user: updatedUser,
            success: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).render('users/edit-profile', {
            title: 'Edit Profile',
            user: req.session?.user || {},
            error: error.message
        });
    }
};