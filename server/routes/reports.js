const express = require('express');
const router = express.Router();
const Grant = require('../models/Grant');
const Donor = require('../models/Donor');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments({ status: 'Active' });
    const totalGrants = await Grant.countDocuments();
    const activeGrants = await Grant.countDocuments({ status: 'Active' });

    const totalReceived = await Transaction.aggregate([
      { $match: { type: { $in: ['Donation Received', 'Grant Disbursement'] }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSpent = await Transaction.aggregate([
      { $match: { type: 'Expenditure', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingApprovals = await Transaction.countDocuments({
      approvalStatus: { $in: ['Pending Review', 'Pending Approval'] }
    });
    const flaggedTransactions = await Transaction.countDocuments({ isFlagged: true });

    const byCategory = await Transaction.aggregate([
      { $match: { type: 'Expenditure', status: 'Completed' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const byMonth = await Transaction.aggregate([
      { $match: { status: 'Completed' } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        received: { $sum: { $cond: [{ $in: ['$type', ['Donation Received', 'Grant Disbursement']] }, '$amount', 0] } },
        spent: { $sum: { $cond: [{ $eq: ['$type', 'Expenditure'] }, '$amount', 0] } }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const recentTransactions = await Transaction.find()
      .populate('donor', 'name')
      .populate('grant', 'title')
      .sort({ createdAt: -1 }).limit(8);

    const recentAudit = await AuditLog.find().sort({ timestamp: -1 }).limit(8);

    const grantsByStatus = await Grant.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalDonors,
      totalGrants,
      activeGrants,
      totalReceived: totalReceived[0]?.total || 0,
      totalSpent: totalSpent[0]?.total || 0,
      balance: (totalReceived[0]?.total || 0) - (totalSpent[0]?.total || 0),
      pendingApprovals,
      flaggedTransactions,
      byCategory,
      byMonth,
      recentTransactions,
      recentAudit,
      grantsByStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
