const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const AuditLog = require('../models/AuditLog');

// Get all donors
router.get('/', async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: 'i' };
    const donors = await Donor.find(query).sort({ createdAt: -1 });
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single donor
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create donor
router.post('/', async (req, res) => {
  try {
    const donor = new Donor(req.body);
    await donor.save();
    await AuditLog.create({
      action: 'CREATE', entity: 'Donor', entityId: donor._id,
      description: `New donor created: ${donor.name} (${donor.type})`,
      performedBy: req.body.performedBy || 'System', severity: 'Medium'
    });
    res.status(201).json(donor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update donor
router.put('/:id', async (req, res) => {
  try {
    const before = await Donor.findById(req.params.id);
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    await AuditLog.create({
      action: 'UPDATE', entity: 'Donor', entityId: donor._id,
      description: `Donor updated: ${donor.name}`,
      performedBy: req.body.performedBy || 'System', severity: 'Low',
      changes: { before: before?.toObject(), after: donor.toObject() }
    });
    res.json(donor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete donor
router.delete('/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    await AuditLog.create({
      action: 'DELETE', entity: 'Donor', entityId: req.params.id,
      description: `Donor deleted: ${donor.name}`,
      performedBy: req.query.performedBy || 'System', severity: 'High'
    });
    res.json({ message: 'Donor deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add communication to donor
router.post('/:id/communications', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    donor.communications.push(req.body);
    await donor.save();
    res.json(donor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
