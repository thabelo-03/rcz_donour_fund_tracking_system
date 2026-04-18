const express = require('express');
const router = express.Router();
const { analyzeTransaction, batchAnalyzeTransactions, calculateTransparencyScore, calculateDonorConfidence } = require('../services/aiAnalysis');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

/**
 * POST /api/analysis/transaction/:id
 * Analyze a single transaction using AI
 */
router.post('/transaction/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('donor', 'name totalDonated')
      .populate('grant', 'title totalAmount amountRemaining');

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const analysis = await analyzeTransaction(transaction);

    // Log the analysis
    await AuditLog.create({
      action: 'VIEW',
      entity: 'Transaction',
      entityId: transaction._id,
      description: `AI analysis performed on ${transaction.transactionId} — Risk: ${analysis.riskScore}/100 (${analysis.analysisMethod})`,
      performedBy: req.body.performedBy || 'System',
      role: req.body.role || 'system',
      severity: analysis.riskLevel === 'Critical' ? 'Critical' : analysis.riskLevel === 'High' ? 'High' : 'Low'
    });

    // Auto-flag if analysis recommends it
    if (analysis.shouldFlag && !transaction.isFlagged) {
      await Transaction.findByIdAndUpdate(transaction._id, {
        isFlagged: true,
        flagReason: `AI Detected: ${analysis.flagReason}`,
        status: 'Flagged'
      });

      await AuditLog.create({
        action: 'FLAG',
        entity: 'Transaction',
        entityId: transaction._id,
        description: `AI Auto-flagged: ${transaction.transactionId} — ${analysis.flagReason}`,
        performedBy: `AI Analysis (${analysis.analysisMethod})`,
        role: 'system',
        severity: 'High'
      });
    }

    res.json({
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        status: transaction.status
      },
      analysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/analysis/batch
 * Analyze all pending/approved un-flagged transactions
 */
router.post('/batch', async (req, res) => {
  try {
    const results = await batchAnalyzeTransactions();

    const flagged = results.filter(r => r.analysis.shouldFlag).length;
    const total = results.length;

    await AuditLog.create({
      action: 'VIEW',
      entity: 'System',
      description: `Batch AI analysis completed: ${total} transactions analyzed, ${flagged} flagged`,
      performedBy: req.body.performedBy || 'System',
      role: req.body.role || 'system',
      severity: flagged > 0 ? 'High' : 'Low'
    });

    res.json({
      totalAnalyzed: total,
      flaggedCount: flagged,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/analysis/transparency
 * Get dynamic transparency score calculated from actual data
 */
router.get('/transparency', async (req, res) => {
  try {
    const transparency = await calculateTransparencyScore();
    res.json(transparency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/analysis/donor-confidence/:id
 * Get dynamic confidence score for a specific donor
 */
router.get('/donor-confidence/:id', async (req, res) => {
  try {
    const score = await calculateDonorConfidence(req.params.id);
    res.json({ donorId: req.params.id, confidenceScore: score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
