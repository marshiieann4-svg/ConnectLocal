const Assignment = require('../models/Assignment');
const Client = require('../models/Client');
const User = require('../models/User');

// @desc    Create an assignment (assign a helper to a client)
// @route   POST /api/assignments
const createAssignment = async (req, res) => {
  try {
    // Verify that the client belongs to this organization
    const client = await Client.findOne({ _id: req.body.clientId, organizationId: req.user.id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Verify that the helper exists and is a helper
    const helper = await User.findOne({ _id: req.body.helperId, accountType: 'individual', role: { $in: ['helper', 'both'] } });
    if (!helper) {
      return res.status(400).json({ success: false, message: 'Invalid helper' });
    }
    const assignment = await Assignment.create({
      ...req.body,
      organizationId: req.user.id
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all assignments for the organization
// @route   GET /api/assignments
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ organizationId: req.user.id })
      .populate('clientId', 'name phone address')
      .populate('helperId', 'name phone averageRating')
      .sort('-createdAt');
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update assignment status
// @route   PUT /api/assignments/:id
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organizationId: req.user.id // or allow helper access too
    }).populate('clientId', 'name phone address').populate('helperId', 'name phone');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAssignment, getAssignments, updateAssignment, getAssignmentById };