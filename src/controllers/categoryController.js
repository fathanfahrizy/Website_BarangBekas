const pool = require("../config/database");

async function getCategories(_req, res) {
  const result = await pool.query("SELECT id, name FROM categories ORDER BY id");
  res.json({ categories: result.rows });
}

module.exports = {
  getCategories,
};
