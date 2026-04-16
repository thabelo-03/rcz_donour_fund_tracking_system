const express = require('express');
const router = express.Router();
const Grant = require('../models/Grant');
const Donor = require('../models/Donor');
const AuditLog = require('../models/AuditLog');

// Get all grants
router.get('/', async (req, res) => {
  try {
    const { status, category, donor, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (donor) query.donor = donor;
    if (search) query.title = { $regex: search, $options: 'i' };
    const grants = await Grant.find(query).populate('donor', 'name type').sort({ createdAt: -1 });
    res.json(grants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single grant
router.get('/:id', async (req, res) => {
  try {
    const grant = await Grant.findById(req.params.id).populate('donor', 'name type email');
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    res.json(grant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create grant
router.post('/', async (req, res) => {
  try {
    const grantCount = await Grant.countDocuments();
    req.body.grantNumber = `GRT-${new Date().getFullYear()}-${String(grantCount + 1).padStart(4, '0')}`;
    req.body.amountRemaining = req.body.totalAmount;

    const grant = new Grant(req.body);
    await grant.save();

    // Update donor stats
    await Donor.findByIdAndUpdate(grant.donor, { $inc: { totalGrants: 1, activeGrants: 1, totalDonated: grant.totalAmount } });

    await AuditLog.create({
      action: 'CREATE', entity: 'Grant', entityId: grant._id,
      description: `New grant created: ${grant.title} ($${grant.totalAmount.toLocaleString()})`,
      performedBy: req.body.performedBy || 'System', severity: 'High'
    });
    const populated = await Grant.findById(grant._id).populate('donor', 'name type');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update grant
router.put('/:id', async (req, res) => {
  try {
    const grant = await Grant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('donor', 'name type');
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    await AuditLog.create({
      action: 'UPDATE', entity: 'Grant', entityId: grant._id,
      description: `Grant updated: ${grant.title} (status: ${grant.status})`,
      performedBy: req.body.performedBy || 'System', severity: 'Medium'
    });
    res.json(grant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update grant status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const grant = await Grant.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('donor', 'name type');
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    
    if (status === 'Closed' || status === 'Suspended') {
      await Donor.findByIdAndUpdate(grant.donor._id, { $inc: { activeGrants: -1 } });
    }
    
    await AuditLog.create({
      action: 'UPDATE', entity: 'Grant', entityId: grant._id,
      description: `Grant status changed to ${status}: ${grant.title}`,
      performedBy: req.body.performedBy || 'System', severity: 'High'
    });
    res.json(grant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update milestone
router.patch('/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const grant = await Grant.findById(req.params.id);
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    const milestone = grant.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    Object.assign(milestone, req.body);
    await grant.save();
    const populated = await Grant.findById(grant._id).populate('donor', 'name type');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete grant
router.delete('/:id', async (req, res) => {
  try {
    const grant = await Grant.findByIdAndDelete(req.params.id);
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    await Donor.findByIdAndUpdate(grant.donor, { $inc: { totalGrants: -1, activeGrants: -1 } });
    await AuditLog.create({
      action: 'DELETE', entity: 'Grant', entityId: req.params.id,
      description: `Grant deleted: ${grant.title}`,
      performedBy: req.query.performedBy || 'System', severity: 'Critical'
    });
    res.json({ message: 'Grant deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
