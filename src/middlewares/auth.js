/**
 * Middleware untuk memvalidasi apakah request memiliki session login yang aktif.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: "Silakan masuk terlebih dahulu." });
    return;
  }
  next();
}

module.exports = {
  requireAuth,
};
