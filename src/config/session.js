const crypto = require("node:crypto");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const pool = require("./database");

const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

const sessionConfig = session({
  store: new PgSession({
    pool,
    createTableIfMissing: true,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  },
});

module.exports = sessionConfig;
