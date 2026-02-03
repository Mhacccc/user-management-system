const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    // Only admins allowed
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin required to view audit logs.' });

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('actor', 'name email')
      .populate('target', 'name email');

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyActivity = async (req, res) => {
  try {
    const userId = req.userId;

    // Find logs where the user is either the actor or the target
    const logs = await AuditLog.find({
      $or: [
        { actor: userId },
        { target: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email')
      .populate('target', 'name email');

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAuditLogs,
  getMyActivity,
};
