// Data Migration Script
// Reads existing db_fallback.json and inserts into local PostgreSQL
// Run with: node migrate.js

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:CozyCrochet2026!@localhost:5432/cozy_crochet";

const isSSL =
  DATABASE_URL.includes("sslmode=require") ||
  DATABASE_URL.includes("neon.tech") ||
  DATABASE_URL.includes("supabase.co") ||
  DATABASE_URL.includes("vercel-storage.com");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isSSL ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  console.log("🔄 Starting migration from db_fallback.json to PostgreSQL...\n");

  // Load existing data
  const dataFile = path.join(__dirname, "server", "data", "db_fallback.json");
  if (!fs.existsSync(dataFile)) {
    console.log("⚠️  db_fallback.json not found — starting with empty database.");
    await createTables();
    await pool.end();
    return;
  }

  const raw = fs.readFileSync(dataFile, "utf-8");
  const data = JSON.parse(raw);

  console.log(`📦 Found data:`);
  console.log(`   Products:     ${(data.products || []).length}`);
  console.log(`   Orders:       ${(data.orders || []).length}`);
  console.log(`   Custom Orders:${(data.customOrders || []).length}`);
  console.log(`   Users:        ${(data.users || []).length}`);
  console.log(`   Subscribers:  ${(data.subscribers || []).length}`);
  console.log(`   Inventory:    ${(data.inventory || []).length}`);
  console.log("");

  await createTables();
  await migrateProducts(data.products || []);
  await migrateOrders(data.orders || []);
  await migrateCustomOrders(data.customOrders || []);
  await migrateUsers(data.users || []);
  await migrateSubscribers(data.subscribers || []);
  await migrateInventory(data.inventory || []);

  console.log("\n✅ Migration complete! Your data is now in PostgreSQL.");
  await pool.end();
}

async function createTables() {
  console.log("🏗️  Creating tables...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Blankets',
      price NUMERIC NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '/assets/cloud-throw.jpg',
      badge TEXT DEFAULT '',
      description TEXT DEFAULT 'Hand-crocheted piece.',
      stock INTEGER NOT NULL DEFAULT 10,
      rating NUMERIC DEFAULT 5,
      num_reviews INTEGER DEFAULT 0,
      vendor_id TEXT DEFAULT NULL,
      vendor_name TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      shipping_full_name TEXT NOT NULL,
      shipping_street TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_postal_code TEXT NOT NULL,
      items JSONB NOT NULL DEFAULT '[]',
      payment_method TEXT DEFAULT 'WhatsApp / Direct Transfer',
      subtotal NUMERIC NOT NULL DEFAULT 0,
      gift_wrap BOOLEAN DEFAULT TRUE,
      total NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Processing',
      is_paid BOOLEAN DEFAULT FALSE,
      order_type TEXT NOT NULL DEFAULT 'regular',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_orders (
      id TEXT PRIMARY KEY,
      custom_order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      product_type TEXT NOT NULL,
      color_preference TEXT DEFAULT 'Custom choice',
      size_dimensions TEXT DEFAULT 'Standard',
      design_style TEXT DEFAULT 'Makers Choice',
      quantity INTEGER DEFAULT 1,
      reference_image TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      estimated_budget TEXT DEFAULT '',
      target_date TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'New',
      is_paid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT DEFAULT 'password123',
      role TEXT NOT NULL DEFAULT 'buyer',
      phone TEXT DEFAULT '',
      shop_name TEXT DEFAULT NULL,
      shop_bio TEXT DEFAULT NULL,
      status TEXT DEFAULT 'approved',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      item TEXT NOT NULL,
      type TEXT NOT NULL,
      on_hand INTEGER NOT NULL DEFAULT 0,
      level TEXT NOT NULL DEFAULT 'Healthy',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("   ✅ Tables created!\n");

  // Ensure admin user exists
  await pool.query(`
    INSERT INTO users (id, name, email, password, role, phone)
    VALUES ('usr-admin', 'AJ (Studio Maker)', 'admin@cozycrochet.com', 'adminpassword123', 'admin', '+92 300 0000000')
    ON CONFLICT (email) DO NOTHING
  `);
}

async function migrateProducts(products) {
  if (products.length === 0) return;
  console.log(`📦 Migrating ${products.length} products...`);
  let ok = 0, skip = 0;
  for (const p of products) {
    try {
      await pool.query(
        `INSERT INTO products (id, slug, name, category, price, image, badge, description, stock, rating, num_reviews, vendor_id, vendor_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [p._id || `prod-${Date.now()}-${Math.random()}`, p.slug, p.name, p.category || "Blankets",
         p.price || 0, p.image || "/assets/cloud-throw.jpg", p.badge || "",
         p.description || "Hand-crocheted piece.", p.stock || 10, p.rating || 5,
         p.numReviews || (p.reviews ? p.reviews.length : 0),
         p.vendorId || null, p.vendorName || null]
      );
      // Migrate reviews for this product
      if (p.reviews && p.reviews.length > 0) {
        for (const r of p.reviews) {
          try {
            await pool.query(
              `INSERT INTO reviews (id, product_id, name, rating, comment)
               VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
              [r._id || `rev-${Date.now()}-${Math.random()}`, p._id, r.name, r.rating, r.comment]
            );
          } catch {}
        }
      }
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Products: ${ok} migrated, ${skip} skipped\n`);
}

async function migrateOrders(orders) {
  if (orders.length === 0) return;
  console.log(`📦 Migrating ${orders.length} orders...`);
  let ok = 0, skip = 0;
  for (const o of orders) {
    try {
      const shippingAddr = o.shippingAddress || {};
      await pool.query(
        `INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone,
          shipping_full_name, shipping_street, shipping_city, shipping_postal_code,
          items, payment_method, subtotal, gift_wrap, total, status, is_paid, order_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (id) DO NOTHING`,
        [o._id, o.orderNumber, o.customer?.name || "Customer", o.customer?.email || "customer@example.com",
         o.customer?.phone || "", shippingAddr.fullName || "Customer", shippingAddr.street || "Street",
         shippingAddr.city || "City", shippingAddr.postalCode || "00000",
         JSON.stringify(o.items || []), o.paymentMethod || "WhatsApp / Direct Transfer",
         o.subtotal || 0, o.giftWrap !== false, o.total || 0,
         o.status || "Processing", o.isPaid || false, o.orderType || "regular"]
      );
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Orders: ${ok} migrated, ${skip} skipped\n`);
}

async function migrateCustomOrders(customOrders) {
  if (customOrders.length === 0) return;
  console.log(`📦 Migrating ${customOrders.length} custom orders...`);
  let ok = 0, skip = 0;
  for (const co of customOrders) {
    try {
      await pool.query(
        `INSERT INTO custom_orders (id, custom_order_id, customer_name, customer_email, customer_phone,
          product_type, color_preference, size_dimensions, design_style, quantity,
          reference_image, instructions, estimated_budget, target_date, status, is_paid)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO NOTHING`,
        [co._id, co.customOrderId, co.customerName, co.customerEmail, co.customerPhone,
         co.productType, co.colorPreference || "Custom", co.sizeDimensions || "Standard",
         co.designStyle || "Custom", co.quantity || 1, co.referenceImage || "",
         co.instructions || "", co.estimatedBudget || "", co.targetDate || "",
         co.status || "New", co.isPaid || false]
      );
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Custom orders: ${ok} migrated, ${skip} skipped\n`);
}

async function migrateUsers(users) {
  if (users.length === 0) return;
  console.log(`📦 Migrating ${users.length} users...`);
  let ok = 0, skip = 0;
  for (const u of users) {
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password, role, phone, shop_name, shop_bio, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (email) DO NOTHING`,
        [u._id, u.name, u.email?.toLowerCase(), u.password || "password123",
         u.role || "buyer", u.phone || "", u.shopName || null, u.shopBio || null,
         u.status || "approved"]
      );
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Users: ${ok} migrated, ${skip} skipped\n`);
}

async function migrateSubscribers(subscribers) {
  if (subscribers.length === 0) return;
  console.log(`📦 Migrating ${subscribers.length} subscribers...`);
  let ok = 0, skip = 0;
  for (const s of subscribers) {
    const email = typeof s === "string" ? s : s.email;
    if (!email) continue;
    try {
      await pool.query(
        `INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
        [email.toLowerCase()]
      );
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Subscribers: ${ok} migrated, ${skip} skipped\n`);
}

async function migrateInventory(inventory) {
  if (!inventory || inventory.length === 0) return;
  console.log(`📦 Migrating ${inventory.length} inventory items...`);
  let ok = 0, skip = 0;
  for (const inv of inventory) {
    try {
      await pool.query(
        `INSERT INTO inventory (id, item, type, on_hand, level)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [inv._id || `inv-${Date.now()}`, inv.item, inv.type || "Material", Number(inv.onHand) || 0, inv.level || "Healthy"]
      );
      ok++;
    } catch (e) { skip++; }
  }
  console.log(`   ✅ Inventory: ${ok} migrated, ${skip} skipped\n`);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
