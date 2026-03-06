const User = require('../models/User');
const Service = require('../models/Service');

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const completedServices = await Service.countDocuments({ status: 'completed' });
    const activeHelpers = await User.countDocuments({
      $or: [
        { accountType: { $in: ['organization', 'home_care', 'dropin_centre'] } },
        { accountType: 'individual', role: { $in: ['helper', 'both'] } }
      ],
      isActive: true
    });
    res.json({
      success: true,
      data: {
        totalUsers,
        totalServices,
        completedServices,
        activeHelpers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };