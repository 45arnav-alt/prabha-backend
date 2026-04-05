const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, is_admin: user.is_admin },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// User signup
router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, email, first_name, last_name, is_admin',
      [first_name, last_name, email, hash]
    );
    res.json({ token: sign(rows[0]), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    res.json({ token: sign(user), user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, is_admin: user.is_admin } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND is_admin=TRUE', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    res.json({ token: sign(user), user: { id: user.id, email: user.email, first_name: user.first_name, is_admin: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'No credential provided' });
  try {
    // Verify Google token by calling Google's tokeninfo endpoint
    const googleRes = await new Promise((resolve, reject) => {
      https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (googleRes.error) return res.status(401).json({ error: 'Invalid Google token' });

    const { email, given_name, family_name, sub: googleId } = googleRes;
    if (!email) return res.status(401).json({ error: 'No email from Google' });

    // Find or create user
    let { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    let user;
    if (rows.length) {
      user = rows[0];
    } else {
      const randomPass = await bcrypt.hash(googleId + Date.now(), 10);
      const result = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING *',
        [given_name || '', family_name || '', email, randomPass]
      );
      user = result.rows[0];
    }

    res.json({
      token: sign(user),
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, is_admin: user.is_admin }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, first_name, last_name, email, phone, is_admin, created_at FROM users WHERE id=$1', [req.user.id]);
  res.json(rows[0]);
});

// Update profile
router.put('/me', auth, async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  const { rows } = await pool.query(
    'UPDATE users SET first_name=$1, last_name=$2, phone=$3 WHERE id=$4 RETURNING id, first_name, last_name, email, phone',
    [first_name, last_name, phone, req.user.id]
  );
  res.json(rows[0]);
});

module.exports = router;
