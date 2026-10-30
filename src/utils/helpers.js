/**
 * Membentuk objek data profil user yang aman dikirim ke client (tanpa password_hash).
 */
function profileShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    username: row.username,
    displayName: row.username || row.full_name,
    npm: row.npm,
    phone: row.phone,
    avatarUrl: row.avatar_url,
  };
}

/**
 * Higher-Order Function wrapper untuk menangani async route handler di Express,
 * mencegah unhandled promise rejection dan otomatis meneruskan error ke next(error).
 */
function handleRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = {
  profileShape,
  handleRoute,
};
