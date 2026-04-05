const router = require('express').Router();
const pool = require('../db');
const { adminAuth } = require('../middleware/auth');

// Helper to format product row
const formatProduct = (row, variants = [], reviews = []) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: parseFloat(row.price),
  category: row.category,
  image: row.image,
  images: row.images || [],
  rating: parseFloat(row.rating),
  reviews: row.reviews_count,
  isNew: row.is_new,
  isBestseller: row.is_bestseller,
  ingredients: row.ingredients || [],
  howToUse: row.how_to_use,
  stock: row.stock,
  isActive: row.is_active,
  discount: row.discount_pct ? parseInt(row.discount_pct) : (row.discount || 0),
  variants: variants.map(v => ({ id: v.id, name: v.name, colorCode: v.color_code })),
  reviewsList: reviews.map(r => ({
    id: String(r.id),
    author: r.author,
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    content: r.content
  }))
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const { rows: products } = await pool.query(`
      SELECT p.*, d.percentage as discount_pct
      FROM products p
      LEFT JOIN discounts d ON d.product_id = p.id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at
    `);
    const { rows: variants } = await pool.query('SELECT * FROM product_variants');
    const { rows: reviews } = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');

    const result = products.map(p => formatProduct(
      p,
      variants.filter(v => v.product_id === p.id),
      reviews.filter(r => r.product_id === p.id)
    ));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, d.percentage as discount_pct
      FROM products p LEFT JOIN discounts d ON d.product_id = p.id
      WHERE p.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const { rows: variants } = await pool.query('SELECT * FROM product_variants WHERE product_id=$1', [req.params.id]);
    const { rows: reviews } = await pool.query('SELECT * FROM reviews WHERE product_id=$1 ORDER BY created_at DESC', [req.params.id]);
    res.json(formatProduct(rows[0], variants, reviews));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST review
router.post('/:id/reviews', async (req, res) => {
  const { author, rating, content } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO reviews (product_id, author, rating, content) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, author, rating, content]
    );
    const r = rows[0];
    res.json({
      id: String(r.id), author: r.author, rating: r.rating, content: r.content,
      date: new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create product
router.post('/', adminAuth, async (req, res) => {
  const { id, name, description, price, category, image, images, rating, is_new, is_bestseller, ingredients, how_to_use, stock, discount } = req.body;
  try {
    const { rows } = await pool.query(`
      INSERT INTO products (id, name, description, price, category, image, images, rating, is_new, is_bestseller, ingredients, how_to_use, stock, discount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
    `, [id, name, description, price, category, image, images || [], rating || 4.5, is_new || false, is_bestseller || false, ingredients || [], how_to_use, stock || 0, discount || 0]);
    res.json(formatProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update product
router.put('/:id', adminAuth, async (req, res) => {
  const { name, description, price, category, image, images, is_new, is_bestseller, ingredients, how_to_use, stock, is_active, discount } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE products SET name=$1, description=$2, price=$3, category=$4, image=$5, images=$6,
        is_new=$7, is_bestseller=$8, ingredients=$9, how_to_use=$10, stock=$11, is_active=$12, discount=$13
      WHERE id=$14 RETURNING *
    `, [name, description, price, category, image, images || [], is_new, is_bestseller, ingredients || [], how_to_use, stock, is_active !== false, discount || 0, req.params.id]);
    res.json(formatProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
