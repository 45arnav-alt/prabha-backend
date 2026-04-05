const router = require('express').Router();
const pool = require('../db');
const { auth, adminAuth } = require('../middleware/auth');

const formatOrder = (row, items = []) => ({
  id: row.id,
  customerId: row.customer_id ? String(row.customer_id) : null,
  customerName: row.customer_name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  city: row.city,
  country: row.country,
  items: items.map(i => ({
    productId: i.product_id,
    productName: i.product_name,
    productImage: i.product_image,
    price: parseFloat(i.price),
    quantity: i.quantity,
    variant: i.variant
  })),
  subtotal: parseFloat(row.subtotal),
  shipping: parseFloat(row.shipping),
  tax: parseFloat(row.tax),
  total: parseFloat(row.total),
  status: row.status,
  trackingNumber: row.tracking_number,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Admin: Get all orders
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const { rows: items } = await pool.query('SELECT * FROM order_items');
    res.json(orders.map(o => formatOrder(o, items.filter(i => i.order_id === o.id))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: Get own orders
router.get('/my', auth, async (req, res) => {
  try {
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE customer_id=$1 ORDER BY created_at DESC', [req.user.id]);
    const orderIds = orders.map(o => o.id);
    if (!orderIds.length) return res.json([]);
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = ANY($1)', [orderIds]);
    res.json(orders.map(o => formatOrder(o, items.filter(i => i.order_id === o.id))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order (checkout)
router.post('/', async (req, res) => {
  const { customerName, email, phone, address, city, country, state, zip, items, subtotal, shipping, tax, total, paymentMethod, last4 } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [lastOrder] } = await client.query("SELECT id FROM orders ORDER BY created_at DESC LIMIT 1");
    let nextNum = 1;
    if (lastOrder) {
      const match = lastOrder.id.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const year = new Date().getFullYear();
    const orderId = `ORD-${year}-${String(nextNum).padStart(4, '0')}`;
    const customerId = req.headers.authorization ? (() => {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        return jwt.verify(token, process.env.JWT_SECRET).id;
      } catch { return null; }
    })() : null;

    const { rows: [order] } = await client.query(`
      INSERT INTO orders (id, customer_id, customer_name, email, phone, address, city, country, state, zip, subtotal, shipping, tax, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
    `, [orderId, customerId, customerName, email, phone, address, city, country, state, zip, subtotal, shipping, tax, total]);

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, variant) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [orderId, item.productId, item.productName, item.productImage, item.price, item.quantity, item.variant || null]
      );
    }

    const payId = 'PAY-' + Date.now();
    await client.query(
      'INSERT INTO payments (id, order_id, customer_name, amount, method, status, transaction_id, last4) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [payId, orderId, customerName, total, paymentMethod || 'Credit Card', 'pending', 'TXN-' + Date.now(), last4 || null]
    );

    await client.query('COMMIT');
    res.json({ orderId, success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Admin: Update order status
router.patch('/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );
  res.json(rows[0]);
});

// Admin: Update tracking
router.patch('/:id/tracking', adminAuth, async (req, res) => {
  const { trackingNumber } = req.body;
  const { rows } = await pool.query(
    'UPDATE orders SET tracking_number=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [trackingNumber, req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;
