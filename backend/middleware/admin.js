const admin = (req, res, next) => {
  // Support both current and legacy admin field names, case-insensitively.
  const accountType = String(req.user?.accountType || '').toLowerCase();
  const userType = String(req.user?.userType || '').toLowerCase();
  const role = String(req.user?.role || '').toLowerCase();
  const isAdmin = accountType === 'admin' || userType === 'admin' || role === 'admin';

  if (isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
};

module.exports = { admin };