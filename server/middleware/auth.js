// JWT Authentication Middleware
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hrms-super-secret-key-2024';

// Verify JWT Token
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Check specific role
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

// Admin only
export const requireAdmin = requireRole('admin');

// Admin or HR
export const requireAdminOrHR = requireRole('admin', 'hr');

// Admin, HR, or Manager
export const requireManagement = requireRole('admin', 'hr', 'manager');

export { JWT_SECRET };
