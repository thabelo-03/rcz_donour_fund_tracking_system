const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  completedDate: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  deliverables: { type: String },
  amountAllocated: { type: Number, default: 0 },
  amountSpent: { type: Number, default: 0 }
});

const grantSchema = new mongoose.Schema({
  title: { type: String, required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  grantNumber: { type: String, unique: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['Education', 'Health', 'Humanitarian Relief', 'Community Development', 'Infrastructure', 'Capacity Building'],
    required: true
  },
  totalAmount: { type: Number, required: true },
  amountDisbursed: { type: Number, default: 0 },
  amountSpent: { type: Number, default: 0 },
  amountRemaining: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  fundType: {
    type: String,
    enum: ['Restricted', 'Unrestricted', 'Temporarily Restricted'],
    default: 'Restricted'
  },
  status: {
    type: String,
    enum: ['Applied', 'Approved', 'Active', 'Reporting', 'Closed', 'Suspended'],
    default: 'Applied'
  },
  startDate: { type: Date },
  endDate: { type: Date },
  reportingFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
    default: 'Quarterly'
  },
  nextReportDue: { type: Date },
  projectManager: { type: String },
  congregation: { type: String },
  milestones: [milestoneSchema],
  complianceChecklist: [{
    item: { type: String },
    completed: { type: Boolean, default: false },
    completedDate: { type: Date },
    notes: { type: String }
  }],
  conditions: { type: String },
  notes: { type: String }
}, { timestamps: true });

grantSchema.pre('save', function(next) {
  this.amountRemaining = this.totalAmount - this.amountSpent;
  next();
});

module.exports = mongoose.model('Grant', grantSchema);
