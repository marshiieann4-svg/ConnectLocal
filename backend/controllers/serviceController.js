const Service = require('../models/Service');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { awardPoints, checkAndAwardBadges } = require('./gamificationController');
// @desc    Get all services with optional filters
// @route   GET /api/services
const awardPointsForCompletion = async (serviceId) => {
  const service = await Service.findById(serviceId).populate('requesterId helperId');
  if (!service) return;

  // Award points to helper
  await awardPoints(
    service.helperId._id,
    50,
    'Completed service',
    serviceId
  );

  // Award points to requester
  await awardPoints(
    service.requesterId._id,
    10,
    'Service completed',
    serviceId
  );

  // Check for badges for both
  await checkAndAwardBadges(service.helperId._id);
  await checkAndAwardBadges(service.requesterId._id);
};

const getServices = async (req, res) => {
  try {
    const { category, location, minRating, status } = req.query;
    let match = {};
    if (category) match.category = category;
    if (status) match.status = status; // e.g., open, assigned, completed
    if (location) match.location = { $regex: location, $options: 'i' };

    // Aggregation pipeline
    const services = await Service.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'requesterId',
          foreignField: '_id',
          as: 'requester'
        }
      },
      { $unwind: { path: '$requester', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'helperId',
          foreignField: '_id',
          as: 'helper'
        }
      },
      { $unwind: { path: '$helper', preserveNullAndEmptyArrays: true } },
      {
        $match: minRating ? { 'helper.averageRating': { $gte: parseFloat(minRating) } } : {}
      },
      {
        $lookup: {
          from: 'offers',
          localField: '_id',
          foreignField: 'serviceId',
          as: 'offers'
        }
      },
      { $addFields: { offerCount: { $size: '$offers' } } },
      { $project: { offers: 0 } }, // remove offers array from response
      { $sort: { createdAt: -1 } }
    ]);

    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single service with full details
// @route   GET /api/services/:id
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('requesterId', 'name phone averageRating')
      .populate('helperId', 'name phone averageRating');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Get offers for this service (if any)
    const offers = await Offer.find({ serviceId: service._id })
      .populate('helperId', 'name averageRating')
      .sort('-createdAt');

    res.json({
      success: true,
      data: {
        ...service.toObject(),
        offers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a service
// @route   POST /api/services
const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    // Also delete associated offers
    await Offer.deleteMany({ serviceId: req.params.id });
    res.json({ success: true, message: 'Service removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Helper applies (makes an offer) for a service
// @route   POST /api/services/:id/apply
const applyForService = async (req, res) => {
  try {
    const { message, proposedAmount } = req.body;
    const serviceId = req.params.id;
    const helperId = req.user.id; // from auth middleware

    // Check if service exists and is open
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (service.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This service is no longer accepting applications' });
    }

    // Check if already applied
    const existingOffer = await Offer.findOne({ serviceId, helperId });
    if (existingOffer) {
      return res.status(400).json({ success: false, message: 'You have already applied for this service' });
    }

    const offer = await Offer.create({
      serviceId,
      helperId,
      message,
      proposedAmount
    });

    // Increment offer count on service (optional)
    await Service.findByIdAndUpdate(serviceId, { $inc: { offerCount: 1 } });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Requester accepts an offer
// @route   PUT /api/services/:serviceId/accept-offer/:offerId
const acceptOffer = async (req, res) => {
  try {
    const { serviceId, offerId } = req.params;
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    // Ensure the requester is the one making the request
    if (service.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const offer = await Offer.findById(offerId);
    if (!offer || offer.serviceId.toString() !== serviceId) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    // Update offer status
    offer.status = 'accepted';
    await offer.save();
    // Assign helper to service and update status
    service.helperId = offer.helperId;
    service.status = 'assigned';
    await service.save();
    // Reject all other offers
    await Offer.updateMany(
      { serviceId, _id: { $ne: offerId } },
      { status: 'rejected' }
    );
    res.json({ success: true, message: 'Offer accepted', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  applyForService,
  acceptOffer,
};