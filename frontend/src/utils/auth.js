export const isAdminUser = (user = {}) => {
  const accountType = String(user.accountType || '').toLowerCase();
  const userType = String(user.userType || '').toLowerCase();
  const role = String(user.role || '').toLowerCase();

  return accountType === 'admin' || userType === 'admin' || role === 'admin';
};

export const isOrganizationUser = (user = {}) => {
  const accountType = String(user.accountType || '').toLowerCase();
  return ['organization', 'home_care', 'dropin_centre'].includes(accountType);
};

export const getDefaultRouteForUser = (user = {}) => {
  if (isAdminUser(user)) return '/admin';
  if (isOrganizationUser(user)) return '/org-dashboard';
  return '/dashboard';
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};
