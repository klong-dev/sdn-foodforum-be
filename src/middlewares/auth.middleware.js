// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

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

exports.optionalVerifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        // No token provided, continue without user
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Invalid token, continue without user
        req.user = null;
        next();
    }
};

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
    console.log(permission);
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

// For content ownership checks
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

// Optional - allow access only to specific operations on own content
exports.allowIfOwnerOr = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user has the admin/mod permission first
        if (req.user.permissions.includes(permission)) {
            return next();
        }

        // Otherwise check ownership - implement per model as needed
        // This is a simplified example - you'll need to implement actual check
        if (req.resourceOwnerId === req.user.id) {
            return next();
        }

        res.status(403).json({ error: 'Access denied.' });
    };
};