const User = require('../models/User');

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

    const before = await User.findById(req.params.id).select('-password');
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

    // Audit (record update)
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: 'update',
      target: updatedUser._id,
      actor: req.userId,
      actorType: req.userRole === 'admin' ? 'admin' : 'self',
      message: `User updated by ${req.userId}`,
      details: {
        before: {
          name: before?.name,
          email: before?.email,
          role: before?.role,
          passwordChanged: false
        },
        after: {
          name: updatedUser?.name,
          email: updatedUser?.email,
          role: updatedUser?.role,
          passwordChanged: !!updates.password
        }
      }
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const AuditLog = require('../models/AuditLog');

// ... (other functions: getAllUsers, getUser, createUser, updateUser)

deleteUser = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, '../backend-debug.log');

  const log = (msg) => {
    try {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { console.error('Log failed', e); }
  };

  log(`[DELETE USER] Request received for ID: ${req.params.id}`);
  log(`[DELETE USER] Admin ID: ${req.userId}, Role: ${req.userRole}`);

  try {
    if (req.userRole !== 'admin') {
      log(`[DELETE USER] Unauthorized: Role is ${req.userRole}`);
      return res.status(403).json({ message: 'Admin required to delete users.' });
    }

    // Check for valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      log(`[DELETE USER] Invalid ID format: ${req.params.id}`);
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const deleted = await User.findByIdAndDelete(req.params.id).select('-password');

    if (!deleted) {
      log(`[DELETE USER] User not found in DB: ${req.params.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    log(`[DELETE USER] User deleted from DB. Creating AuditLog...`);

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
      log(`[DELETE USER] AuditLog created successfully.`);
    } catch (auditErr) {
      log(`[DELETE USER] AuditLog creation FAILED: ${auditErr.message}`);
      console.error("[DELETE USER] Audit Log Failed:", auditErr);
    }

    log(`[DELETE USER] Success - Sending 200`);
    res.json({ message: "User deleted" });
  } catch (err) {
    log(`[DELETE USER] CRITICAL ERROR: ${err.message}\n${err.stack}`);
    console.error(`[DELETE USER] Error:`, err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
}