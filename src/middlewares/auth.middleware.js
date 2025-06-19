const jwt = require('jsonwebtoken');

// API authentication middleware
exports.verifyToken = (req, res, next) => {
    // Try to get token from different sources
    const token = req.cookies?.accessToken ||
        req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Web page authentication middleware
exports.isLoggedIn = (req, res, next) => {
    if (!req.session?.user) {
        // Store the URL they were trying to access
        req.session.returnTo = req.originalUrl;

        // Add flash message if needed
        if (req.session.flash) {
            req.session.flash.message = 'Please log in to access this page';
            req.session.flash.type = 'warning';
        }

        return res.redirect('/auth/login');
    }
    next();
};

// Role-based access for web pages
exports.hasRole = (roles) => {
    return (req, res, next) => {
        // First check if user is logged in
        if (!req.session?.user) {
            req.session.returnTo = req.originalUrl;
            return res.redirect('/auth/login');
        }

        // Convert to array if single role provided
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (allowedRoles.includes(req.session.user.role)) {
            return next();
        }

        // For web pages, render a forbidden page instead of JSON response
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'You do not have permission to access this page.',
            isAuthenticated: true,
            user: req.session.user
        });
    };
};

// Content ownership check for web pages
exports.isOwnerOrAdmin = (fetchResourceFn) => {
    return async (req, res, next) => {
        if (!req.session?.user) {
            req.session.returnTo = req.originalUrl;
            return res.redirect('/auth/login');
        }

        // Admin and moderators bypass ownership check
        if (['admin', 'moderator'].includes(req.session.user.role)) {
            return next();
        }

        try {
            // fetchResourceFn should be a function that returns the resource with its owner ID
            const resource = await fetchResourceFn(req);

            if (!resource) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'The requested resource could not be found.',
                    isAuthenticated: true,
                    user: req.session.user
                });
            }

            // Check if current user is the owner
            const ownerId = resource.author?.toString() || resource.user?.toString() || resource.userId?.toString();

            if (ownerId === req.session.user.id) {
                return next();
            }

            // Not the owner - render forbidden page
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'You do not have permission to modify this content.',
                isAuthenticated: true,
                user: req.session.user
            });
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).render('error', {
                title: 'Server Error',
                message: 'An error occurred while checking permissions.',
                isAuthenticated: !!req.session?.user,
                user: req.session?.user
            });
        }
    };
};

// Preserve existing functionality for API
exports.requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Convert to array if single role provided
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        // Format the required roles for the error message
        const rolesText = allowedRoles.length > 1
            ? `one of [${allowedRoles.join(', ')}]`
            : allowedRoles[0];

        res.status(403).json({
            error: `Access denied. Required role: ${rolesText}. Your role: ${req.user.role || 'none'}.`
        });
    };
};

exports.requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.permissions.includes(permission)) {
            return next();
        }

        res.status(403).json({ error: `Access denied. Required permission: ${permission}` });
    };
};

// For content ownership checks (API version)
exports.checkOwnership = (model) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Admin and moderators bypass ownership check for content moderation
        if (req.user.role === 'admin' || req.user.role === 'moderator') {
            return next();
        }

        try {
            const content = await model.findById(req.params.id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            // Check if current user is the owner
            if (content.author.toString() === req.user.id) {
                return next();
            }

            res.status(403).json({ error: 'Access denied. You do not own this content.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};