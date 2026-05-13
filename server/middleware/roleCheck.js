export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, error: 'Access denied: No role assigned' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Access denied: Requires one of ${allowedRoles.join(', ')}` });
    }

    next();
  };
};

export const ROLES = {
  ADMIN: 'admin',
  DONOR: 'donor',
  VOLUNTEER: 'volunteer',
  ORPHANAGE: 'orphanage',
  PARTNER: 'community_partner',
};
