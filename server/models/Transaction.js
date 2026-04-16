const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  type: {
    type: String,
    enum: ['Donation Received', 'Grant Disbursement', 'Expenditure', 'Transfer', 'Refund'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  grant: { type: mongoose.Schema.Types.ObjectId, ref: 'Grant' },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Education', 'Health', 'Humanitarian Relief', 'Community Development', 'Infrastructure', 'Capacity Building', 'Administrative', 'Other'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque', 'Mobile Money', 'Online'],
    default: 'Bank Transfer'
  },
  reference: { type: String },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Completed', 'Rejected', 'Flagged'],
    default: 'Pending'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending Initiation', 'Pending Review', 'Pending Approval', 'Approved', 'Rejected'],
    default: 'Pending Initiation'
  },
  initiatedBy: { type: String },
  reviewedBy: { type: String },
  approvedBy: { type: String },
  initiatedDate: { type: Date },
  reviewedDate: { type: Date },
  approvedDate: { type: Date },
  congregation: { type: String },
  project: { type: String },
  attachments: [{ type: String }],
  notes: { type: String },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  reconciled: { type: Boolean, default: false },
  reconciledDate: { type: Date },
  reconciledBy: { type: String }
}, { timestamps: true });

transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
