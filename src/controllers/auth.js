const userService = require('../services/user');

// methods for EJS views
exports.getLoginPage = (req, res) => {
    res.render('auth/login', {
        title: 'Login'
    });
};

exports.getRegisterPage = (req, res) => {
    res.render('auth/register', {
        title: 'Register'
    });
};

// Updated register method with form support
exports.register = async (req, res) => {
    try {
        // Check if this is an API request or form submission
        const isApi = req.path.includes('/api/') || req.xhr;

        // Validate password confirmation for form submissions
        if (!isApi && req.body.password !== req.body.confirmPassword) {
            if (isApi) {
                return res.status(400).json({ error: 'Passwords do not match' });
            } else {
                return res.render('auth/register', {
                    title: 'Register',
                    error: 'Passwords do not match',
                    username: req.body.username,
                    email: req.body.email
                });
            }
        }

        const user = await userService.createUser(req.body);

        if (isApi) {
            return res.status(201).json({
                message: 'User registered successfully',
                user: user.toJSON()
            });
        } else {
            // Redirect to login page with success message
            return res.render('auth/login', {
                title: 'Login',
                success: 'Registration successful! Please log in.'
            });
        }
    } catch (error) {
        if (req.path.includes('/api/') || req.xhr) {
            return res.status(400).json({ error: error.message });
        } else {
            return res.render('auth/register', {
                title: 'Register',
                error: error.message,
                username: req.body.username,
                email: req.body.email
            });
        }
    }
};

// Updated login method with form support
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken, user } = await userService.authenticateUser(email, password);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        // Check if this is an API request or form submission
        if (req.path.includes('/api/') || req.xhr) {
            return res.json({
                message: 'Login successful',
                accessToken: accessToken
            });
        } else {
            // Store user info in session for web views
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            // Redirect to home page after successful login
            return res.redirect('/');
        }
    } catch (error) {
        if (req.path.includes('/api/') || req.xhr) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            } else if (error.message === 'Invalid credentials') {
                return res.status(401).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        } else {
            return res.render('auth/login', {
                title: 'Login',
                error: error.message,
                email: req.body.email
            });
        }
    }
};

// API refresh token endpoint
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const { accessToken } = await userService.refreshAccessToken(refreshToken);

        res.json({
            message: 'Token refreshed successfully',
            accessToken: accessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// Updated logout endpoint with web support
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await userService.logout(refreshToken);
        }

        res.clearCookie('refreshToken');

        // Check if this is an API request or web request
        if (req.path.includes('/api/') || req.xhr) {
            return res.json({ message: 'Logged out successfully' });
        } else {
            // Clear the session
            req.session.destroy();

            // Redirect to login page
            return res.redirect('/auth/login');
        }
    } catch (error) {
        if (req.path.includes('/api/') || req.xhr) {
            return res.status(500).json({ error: error.message });
        } else {
            return res.redirect('/auth/login?error=logout_failed');
        }
    }
};

// API-specific endpoints (to maintain backward compatibility)
exports.apiRegister = async (req, res) => {
    req.path = '/api/register';
    return this.register(req, res);
};

exports.apiLogin = async (req, res) => {
    req.path = '/api/login';
    return this.login(req, res);
};

exports.apiLogout = async (req, res) => {
    req.path = '/api/logout';
    return this.logout(req, res);
};

