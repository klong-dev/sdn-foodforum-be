const userService = require('../services/user');

exports.register = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON()
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await userService.authenticateUser(email, password);

        res.json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        } else if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

