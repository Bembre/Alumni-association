const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);

    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token:', token);

    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);
      req.user = {
        ...decoded,
        _id: decoded.userId,
        id: decoded.userId
      };
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    console.log('Checking role. User:', req.user);
    console.log('Required roles:', roles);

    if (!req.user || !req.user.role) {
      console.log('No user or role found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('Access denied. User role:', req.user.role);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Role check passed');
    next();
  };
};

module.exports = { auth, checkRole }; 