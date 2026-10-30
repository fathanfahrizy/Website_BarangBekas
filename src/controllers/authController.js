const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { validateNpm } = require("../utils/npmValidator");
const { profileShape } = require("../utils/helpers");

async function getMe(req, res) {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }
  const result = await pool.query(
    "SELECT id, npm, full_name, username, phone, avatar_url FROM users WHERE id = $1",
    [req.session.userId],
  );
  if (!result.rowCount) {
    req.session.destroy(() => {});
    res.json({ user: null });
    return;
  }
  res.json({ user: profileShape(result.rows[0]) });
}

async function register(req, res) {
  const npm = String(req.body.npm || "").trim();
  const fullName = String(req.body.fullName || "").trim();
  const phone = String(req.body.phone || "").replace(/[\s-]/g, "");
  const password = String(req.body.password || "");
  const usernameInput = String(req.body.username || "").trim();
  const username = usernameInput || null;

  const npmError = validateNpm(npm);
  if (npmError) return res.status(400).json({ error: npmError });

  if (fullName.length < 2 || fullName.length > 100) {
    return res.status(400).json({ error: "Nama harus berisi 2–100 karakter." });
  }

  if (username && !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    return res
      .status(400)
      .json({ error: "Username harus 3–30 karakter: huruf, angka, atau garis bawah." });
  }

  if (!/^08\d{8,11}$/.test(phone)) {
    return res.status(400).json({
      error: "Nomor telepon harus berupa nomor Indonesia, misalnya 081234567890.",
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Kata sandi harus berisi 8–72 karakter." });
  }

  const program = await pool.query(
    "SELECT 1 FROM study_programs WHERE prefix = $1",
    [npm.slice(0, 3)],
  );
  if (!program.rowCount) {
    return res.status(400).json({ error: "Kode program pada NPM tidak terdaftar." });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (npm, full_name, username, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, npm, full_name, username, phone, avatar_url`,
      [npm, fullName, username, phone, passwordHash],
    );

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) return reject(error);
        req.session.userId = result.rows[0].id;
        req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
      });
    });

    res.status(201).json({ user: profileShape(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "NPM, username, atau nomor telepon sudah digunakan." });
    }
    if (error.code === "23503" || error.code === "23514") {
      return res
        .status(400)
        .json({ error: "NPM tidak memenuhi aturan validasi database." });
    }
    throw error;
  }
}

async function login(req, res) {
  const npm = String(req.body.npm || "").trim();
  const password = String(req.body.password || "");

  const npmError = validateNpm(npm);
  if (npmError) return res.status(400).json({ error: npmError });

  const result = await pool.query(
    "SELECT id, npm, full_name, username, phone, avatar_url, password_hash FROM users WHERE npm = $1",
    [npm],
  );

  if (
    !result.rowCount ||
    !(await bcrypt.compare(password, result.rows[0].password_hash))
  ) {
    return res.status(401).json({ error: "NPM atau kata sandi salah." });
  }

  req.session.regenerate((error) => {
    if (error) {
      return res.status(500).json({ error: "Sesi gagal dibuat. Silakan coba lagi." });
    }
    req.session.userId = result.rows[0].id;
    req.session.save((saveError) => {
      if (saveError) {
        return res.status(500).json({ error: "Sesi gagal disimpan. Silakan coba lagi." });
      }
      res.json({ user: profileShape(result.rows[0]) });
    });
  });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
}

async function updateProfile(req, res) {
  const fullName = String(req.body.fullName || "").trim();
  const usernameInput = String(req.body.username || "").trim();
  const username = usernameInput || null;
  const phone = String(req.body.phone || "").replace(/[\s-]/g, "");

  if (fullName.length < 2 || fullName.length > 100) {
    return res.status(400).json({ error: "Nama harus berisi 2–100 karakter." });
  }

  if (username && !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    return res
      .status(400)
      .json({ error: "Username harus 3–30 karakter: huruf, angka, atau garis bawah." });
  }

  if (!/^08\d{8,11}$/.test(phone)) {
    return res.status(400).json({
      error: "Nomor telepon harus berupa nomor Indonesia, misalnya 081234567890.",
    });
  }

  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  let result;
  try {
    result = await pool.query(
      `UPDATE users SET full_name = $1, username = $2, phone = $3,
         avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, npm, full_name, username, phone, avatar_url`,
      [fullName, username, phone, avatarUrl || null, req.session.userId],
    );
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username atau nomor telepon sudah digunakan." });
    }
    throw error;
  }
  res.json({ user: profileShape(result.rows[0]) });
}

module.exports = {
  getMe,
  register,
  login,
  logout,
  updateProfile,
};
