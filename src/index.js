require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createSchema = require('./schema');
const seed = require('./seed');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:4173',
    'https://prabha-frontend.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.use('/api/addresses', require('./routes/addresses'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

createSchema()
  .then(() => seed())
  .then(() => app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Failed to start:', err); process.exit(1); });
