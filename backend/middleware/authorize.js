const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Acceso denegado: se requiere rol ${roles.join(' o ')}` });
    }
    next();
  };
};

module.exports = { authorize };
