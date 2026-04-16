const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const { action, entity, severity, startDate, endDate, search } = req.query;
    let query = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (severity) query.severity = severity;
    if (search) query.description = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit stats
router.get('/stats', async (req, res) => {
  try {
    const total = await AuditLog.countDocuments();
    const bySeverity = await AuditLog.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const byAction = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    const byEntity = await AuditLog.aggregate([
      { $group: { _id: '$entity', count: { $sum: 1 } } }
    ]);
    const recent = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
    res.json({ total, bySeverity, byAction, byEntity, recent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
