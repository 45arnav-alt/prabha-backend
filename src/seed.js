require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');
const createSchema = require('./schema');

const products = [
  {
    id: '1', name: 'Luminous Glow Serum',
    description: 'A lightweight, hydrating serum that leaves skin with a dewy, radiant finish. Infused with Vitamin C and Hyaluronic Acid.',
    price: 3999, category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800'],
    rating: 4.8, reviews_count: 124, is_bestseller: true,
    ingredients: ['Vitamin C','Hyaluronic Acid','Niacinamide','Aloe Vera'],
    how_to_use: 'Apply 2-3 drops to clean, damp skin morning and night. Follow with moisturizer.',
    discount: 20, stock: 42, is_active: true,
    variants: [{ id: 'v1-30ml', name: '30ml / 1 oz' },{ id: 'v1-50ml', name: '50ml / 1.7 oz' }],
    reviews: [
      { author: 'Sarah M.', rating: 5, content: 'This serum completely changed my skin! It feels so lightweight but gives the most beautiful, natural glow. I use it every morning and have noticed a huge difference in my skin texture.' },
      { author: 'Jessica T.', rating: 4, content: "Really nice serum. It absorbs quickly and doesn't leave a sticky residue. The only reason I gave it 4 stars is because I wish the bottle was a bit larger for the price." }
    ]
  },
  {
    id: '2', name: 'Velvet Matte Lipstick',
    description: 'A highly pigmented, long-lasting matte lipstick that feels comfortable and non-drying on the lips.',
    price: 1999, category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=800','https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800'],
    rating: 4.6, reviews_count: 89, is_new: true,
    ingredients: ['Shea Butter','Vitamin E','Jojoba Oil'],
    how_to_use: 'Apply directly to lips from the bullet or use a lip brush for precision.',
    discount: 0, stock: 60, is_active: true,
    variants: [
      { id: 'v2-ruby', name: 'Ruby Red', color_code: '#9b111e' },
      { id: 'v2-rose', name: 'Dusty Rose', color_code: '#d19c97' },
      { id: 'v2-coral', name: 'Coral Crush', color_code: '#ff7f50' },
      { id: 'v2-nude', name: 'Nude Illusion', color_code: '#d2b48c' }
    ],
    reviews: []
  },
  {
    id: '3', name: 'Purifying Clay Mask',
    description: 'A deeply cleansing mask that draws out impurities and minimizes the appearance of pores without stripping the skin.',
    price: 2999, category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&q=80&w=800','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800'],
    rating: 4.9, reviews_count: 210, is_bestseller: true,
    ingredients: ['Kaolin Clay','Bentonite Clay','Green Tea Extract','Salicylic Acid'],
    how_to_use: 'Apply an even layer to clean, dry skin. Leave on for 10-15 minutes, then rinse thoroughly with warm water. Use 1-2 times a week.',
    discount: 15, stock: 28, is_active: true, variants: [], reviews: []
  },
  {
    id: '4', name: 'Hydrating Rose Mist',
    description: 'A refreshing facial mist that instantly hydrates and revitalizes the skin, leaving a subtle rose scent.',
    price: 2299, category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=800'],
    rating: 4.5, reviews_count: 65,
    ingredients: ['Rose Water','Glycerin','Chamomile Extract'],
    how_to_use: 'Spritz onto face and neck as needed throughout the day for a boost of hydration.',
    discount: 0, stock: 80, is_active: true, variants: [], reviews: []
  },
  {
    id: '5', name: 'Nourishing Body Butter',
    description: 'A rich, whipped body butter that melts into the skin, providing intense moisture and leaving it feeling soft and supple.',
    price: 3499, category: 'Body Care',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800'],
    rating: 4.7, reviews_count: 156, is_bestseller: true,
    ingredients: ['Shea Butter','Cocoa Butter','Coconut Oil','Sweet Almond Oil'],
    how_to_use: 'Massage generously into skin after bathing or showering, focusing on dry areas.',
    discount: 0, stock: 45, is_active: true, variants: [], reviews: []
  },
  {
    id: '6', name: 'Perfecting Concealer',
    description: 'A creamy, buildable concealer that covers imperfections and brightens the under-eye area without creasing.',
    price: 2199, category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800'],
    rating: 4.4, reviews_count: 92, is_new: true,
    ingredients: ['Hyaluronic Acid','Peptides','Caffeine'],
    how_to_use: 'Apply a small amount to desired areas and blend with a brush, sponge, or fingertips.',
    discount: 0, stock: 55, is_active: true, variants: [], reviews: []
  },
  {
    id: '7', name: 'Gentle Foaming Cleanser',
    description: 'A mild, sulfate-free cleanser that effectively removes dirt, oil, and makeup without disrupting the skin barrier.',
    price: 2699, category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'],
    rating: 4.8, reviews_count: 185,
    ingredients: ['Ceramides','Glycerin','Oat Extract'],
    how_to_use: 'Massage a small amount onto damp skin in circular motions. Rinse thoroughly with lukewarm water.',
    discount: 0, stock: 70, is_active: true, variants: [], reviews: []
  },
  {
    id: '8', name: 'Volumizing Mascara',
    description: 'A clump-free mascara that lifts, lengthens, and adds dramatic volume to lashes for a wide-awake look.',
    price: 1799, category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&q=80&w=800'],
    rating: 4.5, reviews_count: 110,
    ingredients: ['Beeswax','Carnauba Wax','Panthenol'],
    how_to_use: 'Wiggle the wand from the base of the lashes to the tips. Apply additional coats for more volume.',
    discount: 0, stock: 90, is_active: true, variants: [], reviews: []
  },
  {
    id: '9', name: 'Exfoliating Body Scrub',
    description: 'A gentle sugar scrub that buffs away dead skin cells, revealing smoother, more radiant skin.',
    price: 2799, category: 'Body Care',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800'],
    rating: 4.6, reviews_count: 78,
    ingredients: ['Sucrose','Coconut Oil','Shea Butter','Coffee Extract'],
    how_to_use: 'Massage onto damp skin in circular motions. Rinse thoroughly. Use 2-3 times a week.',
    discount: 0, stock: 40, is_active: true, variants: [], reviews: []
  },
  {
    id: '10', name: 'Daily SPF 30 Sunscreen',
    description: 'A lightweight, invisible mineral sunscreen that protects against UVA/UVB rays without leaving a white cast.',
    price: 3199, category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'],
    rating: 4.9, reviews_count: 342, is_bestseller: true,
    ingredients: ['Zinc Oxide','Titanium Dioxide','Squalane','Vitamin E'],
    how_to_use: 'Apply generously and evenly as the last step in your skincare routine, 15 minutes before sun exposure.',
    discount: 0, stock: 100, is_active: true, variants: [], reviews: []
  },
  {
    id: '11', name: 'Signature Floral Perfume',
    description: 'A modern, elegant fragrance with notes of jasmine, rose, and warm sandalwood.',
    price: 6999, category: 'Fragrance',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'],
    rating: 4.7, reviews_count: 125, is_new: true,
    ingredients: ['Alcohol Denat','Fragrance (Parfum)','Water (Aqua)'],
    how_to_use: 'Spritz onto pulse points (wrists, neck, behind ears) and let it dry down naturally.',
    discount: 25, stock: 18, is_active: true, variants: [], reviews: []
  },
  {
    id: '12', name: 'The Starter Set',
    description: 'Our three best-selling skincare essentials in travel-friendly sizes. Perfect for trying out the brand or taking on the go.',
    price: 5499, category: 'Sets',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'],
    rating: 4.8, reviews_count: 215, is_bestseller: true,
    ingredients: ['Various - see individual products'],
    how_to_use: 'Follow the instructions for each individual product in the set.',
    discount: 10, stock: 35, is_active: true, variants: [], reviews: []
  }
];

const orders = [
  {
    id: 'ORD-2026-0001', customer_name: 'Emily Johnson', email: 'emily.j@example.com',
    phone: '+1 555 012 3456', address: '24 Rosewood Lane', city: 'New York', country: 'USA', state: 'NY', zip: '10001',
    subtotal: 99.60, shipping: 0, tax: 8.96, total: 108.56, status: 'delivered', tracking_number: 'TRK9823741',
    created_at: '2026-03-10T09:15:00Z', updated_at: '2026-03-14T16:30:00Z',
    items: [
      { product_id: '1', product_name: 'Luminous Glow Serum', product_image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200', price: 38.40, quantity: 1 },
      { product_id: '3', product_name: 'Purifying Clay Mask', product_image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&q=80&w=200', price: 30.60, quantity: 2 }
    ]
  },
  {
    id: 'ORD-2026-0002', customer_name: 'Sophia Martinez', email: 'sophia.m@example.com',
    phone: '+1 555 987 6543', address: '8 Magnolia Street', city: 'Los Angeles', country: 'USA', state: 'CA', zip: '90001',
    subtotal: 72, shipping: 5.99, tax: 6.48, total: 84.47, status: 'shipped', tracking_number: 'TRK5512984',
    created_at: '2026-03-15T11:40:00Z', updated_at: '2026-03-17T08:00:00Z',
    items: [
      { product_id: '2', product_name: 'Velvet Matte Lipstick', product_image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=200', price: 24, quantity: 3, variant: 'Ruby Red' }
    ]
  },
  {
    id: 'ORD-2026-0003', customer_name: 'Aisha Khan', email: 'aisha.k@example.com',
    phone: '+1 555 246 8101', address: '33 Tulip Avenue', city: 'Chicago', country: 'USA', state: 'IL', zip: '60601',
    subtotal: 105.75, shipping: 0, tax: 9.52, total: 115.27, status: 'processing',
    created_at: '2026-03-18T14:22:00Z', updated_at: '2026-03-18T14:22:00Z',
    items: [
      { product_id: '11', product_name: 'Signature Floral Perfume', product_image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=200', price: 63.75, quantity: 1 },
      { product_id: '5', product_name: 'Nourishing Body Butter', product_image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=200', price: 42, quantity: 1 }
    ]
  },
  {
    id: 'ORD-2026-0004', customer_name: 'Clara Bennett', email: 'clara.b@example.com',
    phone: '+1 555 135 7924', address: '99 Oak Street', city: 'Houston', country: 'USA', state: 'TX', zip: '77001',
    subtotal: 58.50, shipping: 5.99, tax: 5.27, total: 69.76, status: 'pending',
    created_at: '2026-03-20T07:05:00Z', updated_at: '2026-03-20T07:05:00Z',
    items: [
      { product_id: '12', product_name: 'The Starter Set', product_image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200', price: 58.50, quantity: 1 }
    ]
  },
  {
    id: 'ORD-2026-0005', customer_name: 'Laura Kim', email: 'laura.k@example.com',
    phone: '+1 555 864 2097', address: '5 Birch Boulevard', city: 'Miami', country: 'USA', state: 'FL', zip: '33101',
    subtotal: 102, shipping: 0, tax: 9.18, total: 111.18, status: 'cancelled', notes: 'Customer requested cancellation.',
    created_at: '2026-03-19T09:33:00Z', updated_at: '2026-03-19T12:10:00Z',
    items: [
      { product_id: '7', product_name: 'Gentle Foaming Cleanser', product_image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200', price: 32, quantity: 2 },
      { product_id: '10', product_name: 'Daily SPF 30 Sunscreen', product_image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200', price: 38, quantity: 1 }
    ]
  }
];

const payments = [
  { id: 'PAY-001', order_id: 'ORD-2026-0001', customer_name: 'Emily Johnson', amount: 108.56, method: 'Credit Card', status: 'completed', transaction_id: 'TXN-CC-88291', last4: '4242', created_at: '2026-03-10T09:18:00Z' },
  { id: 'PAY-002', order_id: 'ORD-2026-0002', customer_name: 'Sophia Martinez', amount: 84.47, method: 'PayPal', status: 'completed', transaction_id: 'TXN-PP-99124', created_at: '2026-03-15T11:42:00Z' },
  { id: 'PAY-003', order_id: 'ORD-2026-0003', customer_name: 'Aisha Khan', amount: 115.27, method: 'Apple Pay', status: 'pending', transaction_id: 'TXN-AP-55013', created_at: '2026-03-18T14:25:00Z' },
  { id: 'PAY-004', order_id: 'ORD-2026-0004', customer_name: 'Clara Bennett', amount: 69.76, method: 'Debit Card', status: 'pending', transaction_id: 'TXN-DC-22847', last4: '1234', created_at: '2026-03-20T07:08:00Z' },
  { id: 'PAY-005', order_id: 'ORD-2026-0005', customer_name: 'Laura Kim', amount: 111.18, method: 'Credit Card', status: 'refunded', transaction_id: 'TXN-CC-71923', last4: '9876', created_at: '2026-03-19T09:36:00Z' }
];

async function seed() {
  try {
    await createSchema();

    // Check if already seeded
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(rows[0].count) > 0) {
      console.log('✅ Database already seeded, skipping...');
      await pool.end();
      return;
    }

    console.log('🌱 Seeding database...');

    // Admin user
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, is_admin)
      VALUES ('Admin', 'User', $1, $2, TRUE)
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@admin.com', adminHash]);

    // Demo user
    const userHash = await bcrypt.hash('User@123', 10);
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone)
      VALUES ('Jane', 'Doe', 'jane@example.com', $1, '+1 555 123 4567')
      ON CONFLICT (email) DO NOTHING
    `, [userHash]);

    // Products
    for (const p of products) {
      await pool.query(`
        INSERT INTO products (id, name, description, price, category, image, images, rating, reviews_count,
          is_new, is_bestseller, ingredients, how_to_use, discount, stock, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, description=EXCLUDED.description, price=EXCLUDED.price,
          discount=EXCLUDED.discount, stock=EXCLUDED.stock
      `, [p.id, p.name, p.description, p.price, p.category, p.image, p.images,
          p.rating, p.reviews_count, p.is_new || false, p.is_bestseller || false,
          p.ingredients, p.how_to_use, p.discount || 0, p.stock, p.is_active !== false]);

      // Variants
      for (const v of (p.variants || [])) {
        await pool.query(`
          INSERT INTO product_variants (id, product_id, name, color_code)
          VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING
        `, [v.id, p.id, v.name, v.color_code || null]);
      }

      // Reviews
      for (const r of (p.reviews || [])) {
        await pool.query(`
          INSERT INTO reviews (product_id, author, rating, content)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT DO NOTHING
        `, [p.id, r.author, r.rating, r.content]);
      }

      // Discounts
      if (p.discount && p.discount > 0) {
        await pool.query(`
          INSERT INTO discounts (product_id, percentage)
          VALUES ($1,$2) ON CONFLICT (product_id) DO UPDATE SET percentage=EXCLUDED.percentage
        `, [p.id, p.discount]);
      }
    }

    // Orders
    for (const o of orders) {
      await pool.query(`
        INSERT INTO orders (id, customer_name, email, phone, address, city, country, state, zip,
          subtotal, shipping, tax, total, status, tracking_number, notes, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::timestamptz,$18::timestamptz)
        ON CONFLICT (id) DO NOTHING
      `, [o.id, o.customer_name, o.email, o.phone, o.address, o.city, o.country,
          o.state || null, o.zip || null, o.subtotal, o.shipping, o.tax, o.total,
          o.status, o.tracking_number || null, o.notes || null, o.created_at, o.updated_at]);

      for (const item of o.items) {
        await pool.query(`
          INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, variant)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [o.id, item.product_id, item.product_name, item.product_image, item.price, item.quantity, item.variant || null]);
      }
    }

    // Payments
    for (const p of payments) {
      await pool.query(`
        INSERT INTO payments (id, order_id, customer_name, amount, method, status, transaction_id, last4, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz) ON CONFLICT (id) DO NOTHING
      `, [p.id, p.order_id, p.customer_name, p.amount, p.method, p.status, p.transaction_id, p.last4 || null, p.created_at]);
    }

    console.log('✅ Seed completed successfully!');
    console.log('Admin login: admin@admin.com / Admin@123');
    console.log('Demo user: jane@example.com / User@123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
