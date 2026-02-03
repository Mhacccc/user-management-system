const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, '../backend-debug.log');

  const log = (msg) => {
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); }
    catch (e) { }
  };

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  log(`[AUTH] Verifying token for: ${req.method} ${req.originalUrl}`);

  if (!token) {
    log(`[AUTH] No token provided`);
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Attach user ID to request for tracking
    req.userRole = decoded.role || 'user'; // Attach role if present in token
    log(`[AUTH] Success. User: ${req.userId}, Role: ${req.userRole}`);
    next();
  } catch (error) {
    log(`[AUTH] Error: ${error.message}`);
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};


module.exports = { verifyToken, requireAdmin };