const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  const users = await User.find().populate('createdBy updatedBy', 'name email');
  res.json(users);
};

exports.createUser = async (req, res) => {
  const newUser = new User({ ...req.body, createdBy: req.userId });
  await newUser.save();
  res.status(201).json(newUser);
};

exports.updateUser = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.userId },
    { new: true }
  );
  res.json(updatedUser);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};