const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

getDashboardStats = async (req, res) => {
  try {
    console.log('[STATS] Fetching dashboard stats...');

    // Calculate 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    console.log('[STATS] Yesterday:', yesterday);

    // Get all users (excluding soft-deleted if applicable)
    const allUsers = await User.find().select('-password');
    console.log('[STATS] Found users:', allUsers.length);

    // Calculate metrics
    const totalUsers = allUsers.length;
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    const userCount = allUsers.filter(u => u.role === 'user').length;
    const newUsers = allUsers.filter(u => new Date(u.createdAt) > yesterday).length;
    console.log('[STATS] Metrics calculated:', { totalUsers, adminCount, userCount, newUsers });

    // Get recent activity from audit logs
    const recentActivity = await AuditLog.countDocuments({
      createdAt: { $gt: yesterday }
    });
    console.log('[STATS] Recent activity:', recentActivity);

    const response = {
      totalUsers,
      adminCount,
      userCount,
      newUsers,
      recentActivity
    };
    console.log('[STATS] Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('[STATS] ERROR:', err);
    console.error('[STATS] Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

getAllUsers = async (req, res) => {
  try {
    // Allow any authenticated user to view the users list.
    // Exclude sensitive fields like password.
    const users = await User.find().select('-password').populate('createdBy updatedBy', 'name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

createUser = async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin required to create users.' });
    const newUser = new User({ ...req.body, createdBy: req.userId });
    await newUser.save();

    // Audit
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: 'create',
      target: newUser._id,
      actor: req.userId,
      actorType: 'admin',
      message: `User created by admin ${req.userId}`,
      details: {
        created: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          _id: newUser._id
        }
      }
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

updateUser = async (req, res) => {
  try {
    // Allow admins to update any user; regular users can only update themselves
    if (req.userRole !== 'admin' && req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this user.' });
    }

    // Prevent non-admins from changing role
    const updates = { ...req.body };
    if (req.userRole !== 'admin' && updates.role) delete updates.role;
    updates.updatedBy = req.userId;

    // Get user before update for audit log
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

    const before = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      role: userToUpdate.role,
      passwordChanged: false
    };

    // Update fields manually to ensure pre-save hooks run
    Object.keys(updates).forEach(key => {
      userToUpdate[key] = updates[key];
    });

    // Save to trigger pre-save middleware (password hashing)
    await userToUpdate.save();

    // Remove password from response
    const updatedUser = userToUpdate.toObject();
    delete updatedUser.password;

    // Audit (record update) only if something actually changed
    const AuditLog = require('../models/AuditLog');
    const after = {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      passwordChanged: !!updates.password
    };

    try {
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        await AuditLog.create({
          action: 'update',
          target: updatedUser._id,
          actor: req.userId,
          actorType: req.userRole === 'admin' ? 'admin' : 'self',
          message: `User updated by ${req.userId}`,
          details: { before, after }
        });
      }
    } catch (auditErr) {
      console.error('[UPDATE USER] Audit Log Failed:', auditErr);
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ... (other functions: getAllUsers, getUser, createUser, updateUser)

deleteUser = async (req, res) => {

  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin required to delete users.' });
    }

    // Check for valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const deleted = await User.findByIdAndDelete(req.params.id).select('-password');

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }


    // Audit
    try {
      await AuditLog.create({
        action: 'delete',
        target: req.params.id,
        actor: req.userId,
        actorType: 'admin',
        message: `User deleted by admin ${req.userId}`,
        details: { deleted }
      });
    } catch (auditErr) {
      console.error("[DELETE USER] Audit Log Failed:", auditErr);
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(`[DELETE USER] Error:`, err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
}