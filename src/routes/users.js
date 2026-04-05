const router = require('express').Router();
const pool = require('../db');
const { adminAuth } = require('../middleware/auth');

// Get all users with order stats
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.created_at) as last_order_at
      FROM users u
      LEFT JOIN orders o ON o.email = u.email
      WHERE u.is_admin = FALSE
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
      email: u.email,
      phone: u.phone || 'N/A',
      joinedAt: u.created_at,
      totalOrders: parseInt(u.total_orders),
      totalSpent: parseFloat(u.total_spent),
      lastOrderAt: u.last_order_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user with full order history
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE id=$1 AND is_admin=FALSE',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rows: orders } = await pool.query(`
      SELECT o.*, json_agg(json_build_object(
        'productId', oi.product_id,
        'productName', oi.product_name,
        'productImage', oi.product_image,
        'price', oi.price,
        'quantity', oi.quantity,
        'variant', oi.variant
      )) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.email = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [user.email]);

    res.json({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
      email: user.email,
      phone: user.phone || 'N/A',
      joinedAt: user.created_at,
      orders: orders.map(o => ({
        id: o.id,
        total: parseFloat(o.total),
        status: o.status,
        createdAt: o.created_at,
        items: o.items || []
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
