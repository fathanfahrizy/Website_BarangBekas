const pool = require("../config/database");
const { conditionLabels } = require("../constants/gunadarma");

const listingSelect = `
  SELECT l.id, l.seller_id, l.category_id, c.name AS category,
         l.title, l.description, l.price, l.item_condition, l.meetup_location,
         l.status, l.created_at, l.sold_at,
         COALESCE(u.username, u.full_name) AS seller_name,
         u.avatar_url AS seller_avatar,
         (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.position LIMIT 1) AS image_url
  FROM listings l
  JOIN users u ON u.id = l.seller_id
  JOIN categories c ON c.id = l.category_id`;

async function getListings(req, res) {
  const values = [];
  const filters = [];

  if (req.query.mine === "true") {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Silakan masuk terlebih dahulu." });
    }
    values.push(req.session.userId);
    filters.push(`l.seller_id = $${values.length}`);
  } else {
    filters.push(
      "(l.status = 'active' OR (l.status = 'sold' AND l.sold_at > now() - interval '3 days'))",
    );
  }

  if (req.query.category) {
    const categoryId = Number(req.query.category);
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      return res.status(400).json({ error: "Kategori tidak valid." });
    }
    values.push(categoryId);
    filters.push(`l.category_id = $${values.length}`);
  }

  if (req.query.q) {
    values.push(`%${String(req.query.q).trim().slice(0, 100)}%`);
    filters.push(`(l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await pool.query(
    `${listingSelect} ${whereClause} ORDER BY l.created_at DESC LIMIT 100`,
    values,
  );
  res.json({ listings: result.rows });
}

async function getListingById(req, res) {
  const result = await pool.query(
    `${listingSelect} WHERE l.id = $1 AND
       (l.status <> 'sold' OR l.sold_at > now() - interval '3 days')`,
    [req.params.id],
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "Barang tidak ditemukan." });
  }

  const images = await pool.query(
    "SELECT url FROM listing_images WHERE listing_id = $1 ORDER BY position",
    [req.params.id],
  );

  res.json({
    listing: {
      ...result.rows[0],
      images: images.rows.map((row) => row.url),
    },
  });
}

async function createListing(req, res) {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const categoryId = Number(req.body.categoryId);
  const price = Number(req.body.price);
  const itemCondition = String(req.body.itemCondition || "");
  const meetupLocation = String(req.body.meetupLocation || "").trim() || null;

  if (title.length < 3 || title.length > 150) {
    return res.status(400).json({ error: "Judul harus berisi 3–150 karakter." });
  }
  if (description.length < 1 || description.length > 5000) {
    return res
      .status(400)
      .json({ error: "Deskripsi wajib diisi (maksimal 5000 karakter)." });
  }
  if (!Number.isSafeInteger(price) || price < 0 || price > 999999999999) {
    return res.status(400).json({ error: "Harga tidak valid." });
  }
  if (!Object.hasOwn(conditionLabels, itemCondition)) {
    return res.status(400).json({ error: "Pilih kondisi barang yang tersedia." });
  }
  if (meetupLocation && meetupLocation.length > 150) {
    return res.status(400).json({ error: "Lokasi meetup maksimal 150 karakter." });
  }

  const category = await pool.query("SELECT id FROM categories WHERE id = $1", [
    categoryId,
  ]);
  if (!category.rowCount) {
    return res.status(400).json({ error: "Kategori tidak valid." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        req.session.userId,
        categoryId,
        title,
        description,
        price,
        itemCondition,
        meetupLocation,
      ],
    );

    for (const [position, file] of (req.files || []).entries()) {
      await client.query(
        "INSERT INTO listing_images (listing_id, url, position) VALUES ($1, $2, $3)",
        [result.rows[0].id, `/uploads/${file.filename}`, position],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateListingStatus(req, res) {
  const status = String(req.body.status || "");
  if (!["active", "sold", "hidden"].includes(status)) {
    return res.status(400).json({ error: "Status barang tidak valid." });
  }

  const result = await pool.query(
    `UPDATE listings SET status = $1::varchar,
       sold_at = CASE WHEN $1::varchar = 'sold'::varchar THEN COALESCE(sold_at, now()) ELSE NULL END
     WHERE id = $2 AND seller_id = $3 RETURNING id, status, sold_at`,
    [status, req.params.id, req.session.userId],
  );

  if (!result.rowCount) {
    return res
      .status(404)
      .json({ error: "Barang tidak ditemukan atau bukan milik Anda." });
  }

  res.json({ listing: result.rows[0] });
}

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListingStatus,
};
