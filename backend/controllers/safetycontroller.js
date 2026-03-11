const SafetyLog = require('../models/Safetylog');
const Assignment = require('../models/Assignment');
const Service = require('../models/Service');
const User = require('../models/User');
const Client = require('../models/Client');
const multer = require('multer');
const path = require('path');

// Multer config for selfie uploads
const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const selfieFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPEG/PNG images allowed'));
};

const selfieUpload = multer({
  storage: selfieStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: selfieFilter
}).single('selfie');

// @desc    Helper checks in for a service (with selfie)
// @route   POST /api/safety/service-checkin/:serviceId
const serviceCheckIn = async (req, res) => {
  selfieUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }
    try {
      const serviceId = req.params.serviceId;
      const helperId = req.user.id;

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      if (!service.helperId || service.helperId.toString() !== helperId) {
        return res.status(403).json({ success: false, message: 'You are not the assigned helper' });
      }
      if (!['assigned', 'in_progress'].includes(service.status)) {
        return res.status(400).json({ success: false, message: 'Service is not in an active state' });
      }

      // Check if already checked in
      const existing = await SafetyLog.findOne({
        serviceId,
        helperId,
        status: { $in: ['checked_in', 'confirmed'] }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Already checked in for this service' });
      }

      const { latitude, longitude, notes } = req.body;

      const log = await SafetyLog.create({
        serviceId,
        helperId,
        requesterId: service.requesterId,
        checkInTime: new Date(),
        checkInLocation: latitude && longitude ? {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        } : undefined,
        checkInPhoto: req.file ? req.file.filename : undefined,
        notes,
        status: 'checked_in'
      });

      // Update service to in_progress
      if (service.status === 'assigned') {
        service.status = 'in_progress';
        await service.save();
      }

      // Send real-time notification to requester
      const io = req.app.get('io');
      if (io) {
        const helper = await User.findById(helperId).select('name');
        io.to(`user:${service.requesterId.toString()}`).emit('safetyCheckIn', {
          logId: log._id,
          serviceId,
          serviceTitle: service.title,
          helperName: helper?.name || 'Helper',
          checkInPhoto: log.checkInPhoto,
          checkInTime: log.checkInTime,
          message: `${helper?.name || 'Your helper'} has checked in for "${service.title}". Please confirm.`
        });
      }

      const populated = await SafetyLog.findById(log._id)
        .populate('helperId', 'name profilePicture')
        .populate('requesterId', 'name');

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// @desc    Requester confirms helper check-in
// @route   PUT /api/safety/confirm/:logId
const confirmCheckIn = async (req, res) => {
  try {
    const logId = req.params.logId;
    const userId = req.user.id;

    const log = await SafetyLog.findById(logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Safety log not found' });
    }
    if (log.requesterId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the requester can confirm check-in' });
    }
    if (log.status !== 'checked_in') {
      return res.status(400).json({ success: false, message: 'Check-in already processed' });
    }

    log.requesterConfirmed = true;
    log.requesterConfirmedAt = new Date();
    log.status = 'confirmed';
    await log.save();

    // Notify helper that their check-in was confirmed
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${log.helperId.toString()}`).emit('checkInConfirmed', {
        logId: log._id,
        serviceId: log.serviceId,
        message: 'Your check-in has been confirmed by the requester!'
      });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Requester disputes a check-in
// @route   PUT /api/safety/dispute/:logId
const disputeCheckIn = async (req, res) => {
  try {
    const logId = req.params.logId;
    const userId = req.user.id;
    const { reason } = req.body;

    const log = await SafetyLog.findById(logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Safety log not found' });
    }
    if (log.requesterId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the requester can dispute' });
    }

    log.requesterDisputed = true;
    log.disputeReason = reason || 'No reason given';
    log.status = 'disputed';
    await log.save();

    // Notify helper
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${log.helperId.toString()}`).emit('checkInDisputed', {
        logId: log._id,
        serviceId: log.serviceId,
        message: 'Your check-in was disputed by the requester.'
      });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Helper checks out of a service (with selfie)
// @route   PUT /api/safety/service-checkout/:logId
const serviceCheckOut = async (req, res) => {
  selfieUpload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }
    try {
      const logId = req.params.logId;
      const helperId = req.user.id;

      const log = await SafetyLog.findOne({
        _id: logId,
        helperId,
        status: { $in: ['checked_in', 'confirmed'] }
      });
      if (!log) {
        return res.status(404).json({ success: false, message: 'No active check-in found' });
      }

      const { latitude, longitude } = req.body;

      log.checkOutTime = new Date();
      log.checkOutLocation = latitude && longitude ? {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      } : undefined;
      log.checkOutPhoto = req.file ? req.file.filename : undefined;
      log.status = 'checked_out';
      await log.save();

      // Notify requester of checkout
      const io = req.app.get('io');
      if (io && log.requesterId) {
        const helper = await User.findById(helperId).select('name');
        const service = await Service.findById(log.serviceId);
        io.to(`user:${log.requesterId.toString()}`).emit('safetyCheckOut', {
          logId: log._id,
          serviceId: log.serviceId,
          serviceTitle: service?.title || 'Service',
          helperName: helper?.name || 'Helper',
          checkOutTime: log.checkOutTime,
          message: `${helper?.name || 'Your helper'} has checked out of "${service?.title || 'the service'}".`
        });
      }

      const populated = await SafetyLog.findById(log._id)
        .populate('helperId', 'name profilePicture')
        .populate('requesterId', 'name');

      res.json({ success: true, data: populated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// @desc    Get safety logs for a service
// @route   GET /api/safety/service/:serviceId
const getServiceSafetyLogs = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const userId = req.user.id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    // Only requester or helper can view
    const isRequester = service.requesterId.toString() === userId;
    const isHelper = service.helperId && service.helperId.toString() === userId;
    if (!isRequester && !isHelper) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const logs = await SafetyLog.find({ serviceId })
      .populate('helperId', 'name profilePicture')
      .sort('-checkInTime');

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Helper checks in for an assignment (original)
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

module.exports = {
  checkIn, checkOut, getHistory,
  serviceCheckIn, serviceCheckOut, confirmCheckIn, disputeCheckIn, getServiceSafetyLogs
};