const SafetyLog = require('../models/Safetylog');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Client = require('../models/Client');

// @desc    Helper checks in for an assignment
// @route   POST /api/safety/checkin/:assignmentId
const checkIn = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const helperId = req.user.id;
    const { latitude, longitude, notes } = req.body;

    // Verify assignment exists and is active, and that the helper is assigned
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      helperId,
      status: 'active'
    });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Active assignment not found' });
    }

    // Check if already checked in
    const existingLog = await SafetyLog.findOne({
      assignmentId,
      helperId,
      status: 'checked_in'
    });
    if (existingLog) {
      return res.status(400).json({ success: false, message: 'Already checked in for this assignment' });
    }

    const log = await SafetyLog.create({
      assignmentId,
      helperId,
      clientId: assignment.clientId,
      checkInTime: new Date(),
      checkInLocation: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      notes,
      status: 'checked_in'
    });

    // Optionally send a notification to the organization (email later)

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Helper checks out of an assignment
// @route   PUT /api/safety/checkout/:logId
const checkOut = async (req, res) => {
  try {
    const logId = req.params.logId;
    const helperId = req.user.id;
    const { latitude, longitude } = req.body;

    const log = await SafetyLog.findOne({ _id: logId, helperId, status: 'checked_in' });
    if (!log) {
      return res.status(404).json({ success: false, message: 'No active check-in found' });
    }

    log.checkOutTime = new Date();
    log.checkOutLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    log.status = 'checked_out';
    await log.save();

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get check-in history for an assignment (organization/helper)
// @route   GET /api/safety/history/:assignmentId
const getHistory = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const userId = req.user.id;

    // Check if user is authorized (helper assigned or organization)
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.helperId.toString() !== userId && assignment.organizationId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const logs = await SafetyLog.find({ assignmentId }).sort('-checkInTime');
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkIn, checkOut, getHistory };