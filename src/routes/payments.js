const router = require('express').Router();
const pool = require('../db');
const { adminAuth } = require('../middleware/auth');

// Admin: Get all payments
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(rows.map(p => ({
      id: p.id,
      orderId: p.order_id,
      customerName: p.customer_name,
      amount: parseFloat(p.amount),
      method: p.method,
      status: p.status,
      transactionId: p.transaction_id,
      last4: p.last4,
      date: p.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
