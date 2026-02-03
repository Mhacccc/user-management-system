const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorType: { type: String, enum: ['admin', 'self', 'system'], default: 'admin' },
  message: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
