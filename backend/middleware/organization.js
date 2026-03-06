const organization = (req, res, next) => {
  if (req.user && (req.user.accountType === 'organization' || req.user.accountType === 'home_care' || req.user.accountType === 'dropin_centre')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Organization only.' });
  }
};

module.exports = { organization };