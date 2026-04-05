const pool = require('./db');

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      category VARCHAR(100),
      image TEXT,
      images TEXT[],
      rating NUMERIC(3,1) DEFAULT 4.5,
      reviews_count INTEGER DEFAULT 0,
      is_new BOOLEAN DEFAULT FALSE,
      is_bestseller BOOLEAN DEFAULT FALSE,
      ingredients TEXT[],
      how_to_use TEXT,
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      discount INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id VARCHAR(100) PRIMARY KEY,
      product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(100),
      color_code VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS discounts (
      product_id VARCHAR(50) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      customer_id INTEGER REFERENCES users(id),
      customer_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100),
      state VARCHAR(100),
      zip VARCHAR(20),
      subtotal NUMERIC(10,2),
      shipping NUMERIC(10,2) DEFAULT 0,
      tax NUMERIC(10,2) DEFAULT 0,
      total NUMERIC(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      tracking_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(50),
      product_name VARCHAR(255),
      product_image TEXT,
      price NUMERIC(10,2),
      quantity INTEGER,
      variant VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(50) PRIMARY KEY,
      order_id VARCHAR(50) REFERENCES orders(id),
      customer_name VARCHAR(255),
      amount NUMERIC(10,2),
      method VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      transaction_id VARCHAR(100),
      last4 VARCHAR(10),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
      author VARCHAR(255),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, author)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, product_id)
    );
  `);
  console.log('Schema created successfully');
}

module.exports = createSchema;
