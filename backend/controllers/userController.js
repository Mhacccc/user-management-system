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

deleteUser = async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin required to delete users.' });
    const deleted = await User.findByIdAndDelete(req.params.id).select('-password');

    // Audit
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action: 'delete',
      target: req.params.id,
      actor: req.userId,
      actorType: 'admin',
      message: `User deleted by admin ${req.userId}`,
      details: { deleted }
    });

    res.json({ message: "User deleted" });
  } catch (err) {
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