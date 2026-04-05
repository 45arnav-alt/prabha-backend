const router = require('express').Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// Ensure addresses table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) DEFAULT 'Home',
    full_name VARCHAR(255),
    street TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(console.error);

// Get all addresses for user
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Add address
router.post('/', auth, async (req, res) => {
  const { label, full_name, street, city, state, zip, country, phone, is_default } = req.body;
  // If setting as default, unset others first
  if (is_default) {
    await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
  }
  const { rows } = await pool.query(
    `INSERT INTO addresses (user_id, label, full_name, street, city, state, zip, country, phone, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, label || 'Home', full_name, street, city, state, zip, country || 'India', phone, is_default || false]
  );
  res.json(rows[0]);
});

// Update address
router.put('/:id', auth, async (req, res) => {
  const { label, full_name, street, city, state, zip, country, phone, is_default } = req.body;
  if (is_default) {
    await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
  }
  const { rows } = await pool.query(
    `UPDATE addresses SET label=$1, full_name=$2, street=$3, city=$4, state=$5, zip=$6, country=$7, phone=$8, is_default=$9
     WHERE id=$10 AND user_id=$11 RETURNING *`,
    [label, full_name, street, city, state, zip, country || 'India', phone, is_default || false, req.params.id, req.user.id]
  );
  res.json(rows[0]);
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Set default
router.patch('/:id/default', auth, async (req, res) => {
  await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
  const { rows } = await pool.query(
    'UPDATE addresses SET is_default=TRUE WHERE id=$1 AND user_id=$2 RETURNING *',
    [req.params.id, req.user.id]
  );
  res.json(rows[0]);
});

module.exports = router;
