const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Grant = require('../models/Grant');
const AuditLog = require('../models/AuditLog');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { type, status, category, startDate, endDate, search, grant: grantId } = req.query;
    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (grantId) query.grant = grantId;
    if (search) query.description = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const transactions = await Transaction.find(query)
      .populate('donor', 'name type')
      .populate('grant', 'title grantNumber')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction summary/stats
router.get('/stats/summary', async (req, res) => {
  try {
    const totalReceived = await Transaction.aggregate([
      { $match: { type: { $in: ['Donation Received', 'Grant Disbursement'] }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenditure = await Transaction.aggregate([
      { $match: { type: 'Expenditure', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const byCategory = await Transaction.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
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
    const pendingApprovals = await Transaction.countDocuments({ approvalStatus: { $in: ['Pending Review', 'Pending Approval'] } });
    const flaggedCount = await Transaction.countDocuments({ isFlagged: true });
    const reconciledCount = await Transaction.countDocuments({ reconciled: true });
    const totalCount = await Transaction.countDocuments();

    res.json({
      totalReceived: totalReceived[0]?.total || 0,
      totalExpenditure: totalExpenditure[0]?.total || 0,
      balance: (totalReceived[0]?.total || 0) - (totalExpenditure[0]?.total || 0),
      byCategory,
      byMonth,
      pendingApprovals,
      flaggedCount,
      reconciledRate: totalCount > 0 ? Math.round((reconciledCount / totalCount) * 100) : 0,
      totalTransactions: totalCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();

    // Update grant spent amount if expenditure
    if (transaction.grant && transaction.type === 'Expenditure' && transaction.status === 'Completed') {
      await Grant.findByIdAndUpdate(transaction.grant, {
        $inc: { amountSpent: transaction.amount, amountRemaining: -transaction.amount }
      });
    }
    if (transaction.grant && transaction.type === 'Grant Disbursement' && transaction.status === 'Completed') {
      await Grant.findByIdAndUpdate(transaction.grant, {
        $inc: { amountDisbursed: transaction.amount }
      });
    }

    await AuditLog.create({
      action: 'CREATE', entity: 'Transaction', entityId: transaction._id,
      description: `Transaction created: ${transaction.type} - $${transaction.amount.toLocaleString()} for ${transaction.description}`,
      performedBy: req.body.performedBy || transaction.initiatedBy || 'System',
      severity: transaction.amount > 10000 ? 'High' : 'Medium'
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('donor', 'name type')
      .populate('grant', 'title grantNumber');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction approval status
router.patch('/:id/approve', async (req, res) => {
  try {
    const { approvalStatus, approvedBy, reviewedBy } = req.body;
    
    // Get before state to prevent double-counting
    const beforeTx = await Transaction.findById(req.params.id);
    if (!beforeTx) return res.status(404).json({ message: 'Transaction not found' });

    const update = { approvalStatus };
    if (approvalStatus === 'Approved') {
      update.approvedBy = approvedBy;
      update.approvedDate = new Date();
      update.status = 'Completed';
    } else if (approvalStatus === 'Pending Approval') {
      update.reviewedBy = reviewedBy;
      update.reviewedDate = new Date();
    } else if (approvalStatus === 'Rejected') {
      update.status = 'Rejected';
    }

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('donor', 'name type')
      .populate('grant', 'title grantNumber');

    // Only apply financial changes if status just changed to Completed
    if (beforeTx.status !== 'Completed' && transaction.status === 'Completed' && transaction.grant) {
      if (transaction.type === 'Expenditure') {
        await Grant.findByIdAndUpdate(transaction.grant, {
          $inc: { amountSpent: transaction.amount, amountRemaining: -transaction.amount }
        });
      } else if (transaction.type === 'Grant Disbursement') {
        await Grant.findByIdAndUpdate(transaction.grant, {
          $inc: { amountDisbursed: transaction.amount }
        });
      }
    }

    await AuditLog.create({
      action: 'APPROVE', entity: 'Transaction', entityId: transaction._id,
      description: `Transaction ${approvalStatus}: ${transaction.transactionId} ($${transaction.amount})`,
      performedBy: approvedBy || reviewedBy || 'System', severity: 'High'
    });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Flag transaction
router.patch('/:id/flag', async (req, res) => {
  try {
    const { isFlagged, flagReason, flaggedBy } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(req.params.id,
      { isFlagged, flagReason, status: isFlagged ? 'Flagged' : 'Pending' },
      { new: true }
    ).populate('donor', 'name type').populate('grant', 'title grantNumber');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await AuditLog.create({
      action: 'FLAG', entity: 'Transaction', entityId: transaction._id,
      description: `Transaction ${isFlagged ? 'flagged' : 'unflagged'}: ${transaction.transactionId} - ${flagReason || 'No reason'}`,
      performedBy: flaggedBy || 'System', severity: 'Critical'
    });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reconcile transaction
router.patch('/:id/reconcile', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id,
      { reconciled: true, reconciledDate: new Date(), reconciledBy: req.body.reconciledBy },
      { new: true }
    ).populate('donor', 'name type').populate('grant', 'title grantNumber');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await AuditLog.create({
      action: 'DELETE', entity: 'Transaction', entityId: req.params.id,
      description: `Transaction deleted: ${transaction.transactionId}`,
      performedBy: req.query.performedBy || 'System', severity: 'Critical'
    });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
