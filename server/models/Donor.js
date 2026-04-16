const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['International', 'NGO', 'Faith-Based', 'Local', 'Government', 'Individual'],
    required: true
  },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  country: { type: String },
  contactPerson: { type: String },
  totalDonated: { type: Number, default: 0 },
  totalGrants: { type: Number, default: 0 },
  activeGrants: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 85, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Prospective'],
    default: 'Active'
  },
  notes: { type: String },
  communications: [{
    date: { type: Date, default: Date.now },
    subject: { type: String },
    message: { type: String },
    type: { type: String, enum: ['Email', 'Meeting', 'Phone', 'Report'] }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Donor', donorSchema);
