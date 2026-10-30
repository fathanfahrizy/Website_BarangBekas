const pool = require("../config/database");

async function getConversationForUser(conversationId, userId) {
  const result = await pool.query(
    "SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
    [conversationId, userId],
  );
  return result.rowCount > 0;
}

async function getConversations(req, res) {
  const result = await pool.query(
    `SELECT co.id, co.listing_id, l.title AS listing_title, l.status AS listing_status,
       CASE WHEN co.buyer_id = $1 THEN COALESCE(s.username, s.full_name)
            ELSE COALESCE(b.username, b.full_name) END AS other_name,
       (SELECT body FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
     FROM conversations co
     JOIN listings l ON l.id = co.listing_id
     JOIN users b ON b.id = co.buyer_id
     JOIN users s ON s.id = co.seller_id
     WHERE co.buyer_id = $1 OR co.seller_id = $1
     ORDER BY COALESCE(
       (SELECT created_at FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1),
       co.created_at
     ) DESC`,
    [req.session.userId],
  );
  res.json({ conversations: result.rows });
}

async function getMessages(req, res) {
  const isParticipant = await getConversationForUser(
    req.params.id,
    req.session.userId,
  );
  if (!isParticipant) {
    return res.status(404).json({ error: "Percakapan tidak ditemukan." });
  }

  const result = await pool.query(
    `SELECT m.id, m.body, m.created_at, m.sender_id,
       COALESCE(u.username, u.full_name) AS sender_name
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1 ORDER BY m.created_at ASC LIMIT 500`,
    [req.params.id],
  );
  res.json({ messages: result.rows });
}

async function createConversation(req, res) {
  const listing = await pool.query(
    "SELECT id, seller_id, status FROM listings WHERE id = $1",
    [req.body.listingId],
  );

  if (!listing.rowCount || listing.rows[0].status !== "active") {
    return res.status(404).json({ error: "Barang sudah tidak tersedia." });
  }
  if (String(listing.rows[0].seller_id) === String(req.session.userId)) {
    return res
      .status(400)
      .json({ error: "Anda tidak dapat memulai chat dengan diri sendiri." });
  }

  const result = await pool.query(
    `INSERT INTO conversations (listing_id, buyer_id, seller_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (listing_id, buyer_id, seller_id)
     DO UPDATE SET listing_id = EXCLUDED.listing_id
     RETURNING id`,
    [listing.rows[0].id, req.session.userId, listing.rows[0].seller_id],
  );

  res.status(201).json({ conversationId: result.rows[0].id });
}

async function sendMessage(req, res) {
  const body = String(req.body.body || "").trim();
  if (body.length < 1 || body.length > 2000) {
    return res.status(400).json({ error: "Pesan harus berisi 1–2000 karakter." });
  }

  const isParticipant = await getConversationForUser(
    req.params.id,
    req.session.userId,
  );
  if (!isParticipant) {
    return res.status(404).json({ error: "Percakapan tidak ditemukan." });
  }

  const result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body)
     VALUES ($1, $2, $3) RETURNING id, body, created_at, sender_id`,
    [req.params.id, req.session.userId, body],
  );

  res.status(201).json({ message: result.rows[0] });
}

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
};
