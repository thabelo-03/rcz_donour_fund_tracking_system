const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'FLAG', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW'],
    required: true
  },
  entity: {
    type: String,
    enum: ['Donor', 'Grant', 'Transaction', 'User', 'Report', 'System'],
    required: true
  },
  entityId: { type: String },
  description: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String },
  ipAddress: { type: String },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed }
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
