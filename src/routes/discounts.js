const router = require('express').Router();
const pool = require('../db');
const { adminAuth } = require('../middleware/auth');

// Get all discounts
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT product_id, percentage FROM discounts');
  const map = {};
  rows.forEach(r => { map[r.product_id] = r.percentage; });
  res.json(map);
});

// Set discount
router.put('/:productId', adminAuth, async (req, res) => {
  const { percentage } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO discounts (product_id, percentage) VALUES ($1,$2)
    ON CONFLICT (product_id) DO UPDATE SET percentage=EXCLUDED.percentage, updated_at=NOW()
    RETURNING *
  `, [req.params.productId, percentage]);
  res.json(rows[0]);
});

// Remove discount
router.delete('/:productId', adminAuth, async (req, res) => {
  await pool.query('DELETE FROM discounts WHERE product_id=$1', [req.params.productId]);
  res.json({ success: true });
});

module.exports = router;
