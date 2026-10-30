const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:password@localhost:5432/marketplace_gunadarma";

const pool = new Pool({
  connectionString,
});

pool.on("error", (err) => {
  console.error("Terjadi error tak terduga pada PostgreSQL pool:", err);
});

module.exports = pool;
