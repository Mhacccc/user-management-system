const express = require('express');
const router = express.Router();
const { getAuditLogs, getMyActivity } = require('../controllers/auditController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Admin-only route for full audit logs
router.get('/', requireAdmin, getAuditLogs);

// User route for personal activity
router.get('/my-activity', getMyActivity);

module.exports = router;
