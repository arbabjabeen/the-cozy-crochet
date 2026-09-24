import { Pool } from "pg";
import {
  getStore,
  saveStore,
  type ProductItem,
  type OrderItem,
  type CustomOrderItem,
  type UserItem,
  type ReviewItem,
  type VendorStatus,
  type UserRole,
} from "./store";

// ============================================================================
// PostgreSQL Database Layer for The Cozy Crochet
// Fully supports Neon, Supabase, Vercel Postgres, AWS RDS, & Local PostgreSQL
// Falls back seamlessly to resilient JSON/in-memory store if DB is offline
// ============================================================================

const getConnectionString = () => {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
};

let poolInstance: Pool | null = null;
let dbInitialized = false;
let initPromise: Promise<boolean> | null = null;

export function getPool(): Pool | null {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!poolInstance) {
    const isSSL =
      connectionString.includes("sslmode=require") ||
      connectionString.includes("neon.tech") ||
      connectionString.includes("supabase.co") ||
      connectionString.includes("vercel-storage.com") ||
      process.env.NODE_ENV === "production";

    poolInstance = new Pool({
      connectionString,
      ssl: isSSL ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    poolInstance.on("error", (err) => {
      console.warn("⚠️ PostgreSQL pool background error:", err.message);
    });
  }

  return poolInstance;
}

// ---------------------------------------------------------------------------
// Auto-initialize Tables & Seed Data if DB is empty
// ---------------------------------------------------------------------------
export async function ensureDbInitialized(): Promise<boolean> {
  if (dbInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = getPool();
    if (!pool) {
      dbInitialized = false;
      return false;
    }

    try {
      // Test connection
      const testRes = await pool.query("SELECT NOW()");
      console.log("✅ PostgreSQL Connected successfully:", testRes.rows[0].now);

      // Create Tables
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
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 5,
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

      // Ensure Master Admin exists
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, phone, status)
        VALUES 
          ('usr-admin', 'AJ (Studio Maker)', 'admin@cozycrochet.com', 'adminpassword123', 'admin', '+92 300 0000000', 'approved'),
          ('usr-admin-arbab', 'AJ (Studio Maker)', 'arbabjabeen2006@gmail.com', 'aj1234qwerty', 'admin', '+92 320 7309867', 'approved')
        ON CONFLICT (email) DO NOTHING;
      `);

      // Check if products table is empty; if so, seed from fallback store
      const prodCheck = await pool.query("SELECT COUNT(*) FROM products");
      const prodCount = parseInt(prodCheck.rows[0].count, 10);

      if (prodCount === 0) {
        console.log("🌱 Database is empty. Auto-seeding initial data from fallback store...");
        const fallback = getStore();

        // Seed Products & Reviews
        if (fallback.products && fallback.products.length > 0) {
          for (const p of fallback.products) {
            try {
              const pid = p._id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              await pool.query(
                `INSERT INTO products (id, slug, name, category, price, image, badge, description, stock, rating, num_reviews, vendor_id, vendor_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  pid,
                  p.slug,
                  p.name,
                  p.category || "Blankets",
                  Number(p.price) || 0,
                  p.image || "/assets/cloud-throw.jpg",
                  p.badge || "",
                  p.description || "Hand-crocheted piece.",
                  Number(p.stock) || 10,
                  Number(p.rating) || 5,
                  Number(p.numReviews) || (p.reviews ? p.reviews.length : 0),
                  p.vendorId || null,
                  p.vendorName || null,
                ]
              );

              if (p.reviews && p.reviews.length > 0) {
                for (const r of p.reviews) {
                  await pool.query(
                    `INSERT INTO reviews (id, product_id, name, rating, comment, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO NOTHING`,
                    [
                      r._id || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      pid,
                      r.name || "Happy Customer",
                      Number(r.rating) || 5,
                      r.comment || "Beautiful craftsmanship!",
                      r.createdAt ? new Date(r.createdAt) : new Date(),
                    ]
                  );
                }
              }
            } catch (err: any) {
              console.warn("Product seed item error:", err.message);
            }
          }
        }

        // Seed Orders
        if (fallback.orders && fallback.orders.length > 0) {
          for (const o of fallback.orders) {
            try {
              await pool.query(
                `INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone,
                  shipping_full_name, shipping_street, shipping_city, shipping_postal_code,
                  items, payment_method, subtotal, gift_wrap, total, status, is_paid, order_type, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  o._id,
                  o.orderNumber,
                  o.customer?.name || "Customer",
                  o.customer?.email || "customer@example.com",
                  o.customer?.phone || "",
                  o.shippingAddress?.fullName || "Customer",
                  o.shippingAddress?.street || "Street Address",
                  o.shippingAddress?.city || "City",
                  o.shippingAddress?.postalCode || "00000",
                  JSON.stringify(o.items || []),
                  o.paymentMethod || "WhatsApp / Direct Transfer",
                  Number(o.subtotal) || 0,
                  o.giftWrap !== false,
                  Number(o.total) || 0,
                  o.status || "Processing",
                  Boolean(o.isPaid),
                  o.orderType || "regular",
                  o.createdAt ? new Date(o.createdAt) : new Date(),
                ]
              );
            } catch {}
          }
        }

        // Seed Custom Orders
        if (fallback.customOrders && fallback.customOrders.length > 0) {
          for (const co of fallback.customOrders) {
            try {
              await pool.query(
                `INSERT INTO custom_orders (id, custom_order_id, customer_name, customer_email, customer_phone,
                  product_type, color_preference, size_dimensions, design_style, quantity,
                  reference_image, instructions, estimated_budget, target_date, status, is_paid, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  co._id,
                  co.customOrderId,
                  co.customerName,
                  co.customerEmail,
                  co.customerPhone,
                  co.productType,
                  co.colorPreference || "Custom choice",
                  co.sizeDimensions || "Standard",
                  co.designStyle || "Makers Choice",
                  Number(co.quantity) || 1,
                  co.referenceImage || "",
                  co.instructions || "",
                  co.estimatedBudget || "",
                  co.targetDate || "",
                  co.status || "New",
                  Boolean(co.isPaid),
                  co.createdAt ? new Date(co.createdAt) : new Date(),
                ]
              );
            } catch {}
          }
        }

        // Seed Users
        if (fallback.users && fallback.users.length > 0) {
          for (const u of fallback.users) {
            try {
              await pool.query(
                `INSERT INTO users (id, name, email, password, role, phone, shop_name, shop_bio, status, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                 ON CONFLICT (email) DO NOTHING`,
                [
                  u._id,
                  u.name,
                  u.email.toLowerCase().trim(),
                  u.password || "password123",
                  u.role || "buyer",
                  u.phone || "",
                  u.shopName || null,
                  u.shopBio || null,
                  u.status || "approved",
                  u.createdAt ? new Date(u.createdAt) : new Date(),
                ]
              );
            } catch {}
          }
        }

        // Seed Subscribers
        if (fallback.subscribers && fallback.subscribers.length > 0) {
          for (const s of fallback.subscribers) {
            try {
              const email = typeof s === "string" ? s : s.email;
              if (email) {
                await pool.query(
                  `INSERT INTO subscribers (id, email, created_at)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (email) DO NOTHING`,
                  [`sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, email.toLowerCase().trim(), new Date()]
                );
              }
            } catch {}
          }
        }

        console.log("✅ PostgreSQL initial data seeded successfully!");
      }

      dbInitialized = true;
      return true;
    } catch (err: any) {
      console.warn("⚠️ Could not connect or initialize PostgreSQL:", err.message);
      console.log("ℹ️  Continuing in resilient JSON fallback store mode.");
      dbInitialized = false;
      return false;
    }
  })();

  return initPromise;
}

// ---------------------------------------------------------------------------
// Helper: Map DB Product Row -> ProductItem
// ---------------------------------------------------------------------------
function mapProductRow(row: any, reviews: ReviewItem[] = []): ProductItem {
  return {
    _id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    badge: row.badge || "",
    description: row.description || "",
    stock: Number(row.stock),
    rating: Number(row.rating),
    numReviews: Number(row.num_reviews),
    vendorId: row.vendor_id || undefined,
    vendorName: row.vendor_name || undefined,
    reviews,
  };
}

// Helper: Map DB Order Row -> OrderItem
function mapOrderRow(row: any): OrderItem {
  let parsedItems = [];
  try {
    parsedItems = typeof row.items === "string" ? JSON.parse(row.items) : row.items || [];
  } catch {
    parsedItems = [];
  }

  return {
    _id: row.id,
    orderNumber: row.order_number,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone || "",
    },
    items: parsedItems,
    shippingAddress: {
      fullName: row.shipping_full_name,
      street: row.shipping_street,
      city: row.shipping_city,
      postalCode: row.shipping_postal_code,
    },
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal),
    giftWrap: Boolean(row.gift_wrap),
    total: Number(row.total),
    status: row.status,
    isPaid: Boolean(row.is_paid),
    orderType: row.order_type || "regular",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// Helper: Map DB Custom Order Row -> CustomOrderItem
function mapCustomOrderRow(row: any): CustomOrderItem {
  return {
    _id: row.id,
    customOrderId: row.custom_order_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    productType: row.product_type,
    colorPreference: row.color_preference,
    sizeDimensions: row.size_dimensions,
    designStyle: row.design_style,
    quantity: Number(row.quantity) || 1,
    referenceImage: row.reference_image || "",
    instructions: row.instructions || "",
    estimatedBudget: row.estimated_budget || "",
    targetDate: row.target_date || "",
    status: row.status || "New",
    isPaid: Boolean(row.is_paid),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// Helper: Map DB User Row -> UserItem
function mapUserRow(row: any): UserItem {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role as UserRole,
    phone: row.phone || "",
    shopName: row.shop_name || undefined,
    shopBio: row.shop_bio || undefined,
    status: row.status as VendorStatus,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// ============================================================================
// PRODUCTS API
// ============================================================================
export async function getProducts(options?: {
  category?: string | null;
  search?: string | null;
  vendorId?: string | null;
}): Promise<ProductItem[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      let query = "SELECT * FROM products WHERE 1=1";
      const params: any[] = [];

      if (options?.category && options.category !== "All") {
        params.push(options.category.toLowerCase());
        query += ` AND LOWER(category) = $${params.length}`;
      }

      if (options?.search) {
        params.push(`%${options.search.toLowerCase()}%`);
        query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
      }

      if (options?.vendorId) {
        params.push(options.vendorId);
        query += ` AND vendor_id = $${params.length}`;
      }

      query += " ORDER BY created_at DESC";
      const res = await pool.query(query, params);
      return res.rows.map((r) => mapProductRow(r));
    } catch (err: any) {
      console.warn("DB query error in getProducts, falling back:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  let list = [...store.products];
  if (options?.category && options.category !== "All") {
    list = list.filter((p) => p.category.toLowerCase() === options.category!.toLowerCase());
  }
  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }
  if (options?.vendorId) {
    list = list.filter((p) => p.vendorId === options.vendorId);
  }
  return list;
}

export async function getProductBySlug(slug: string): Promise<ProductItem | null> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM products WHERE slug = $1 OR id = $1 LIMIT 1",
        [slug]
      );
      if (res.rows.length === 0) return null;

      const pRow = res.rows[0];
      const revRes = await pool.query(
        "SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC",
        [pRow.id]
      );
      const reviews: ReviewItem[] = revRes.rows.map((r) => ({
        _id: r.id,
        name: r.name,
        rating: Number(r.rating),
        comment: r.comment,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));

      return mapProductRow(pRow, reviews);
    } catch (err: any) {
      console.warn("DB error in getProductBySlug:", err.message);
    }
  }

  const store = getStore();
  const p = store.products.find((item) => item.slug === slug || item._id === slug);
  return p || null;
}

export async function createProduct(data: {
  name: string;
  slug?: string;
  category?: string;
  price: number;
  image?: string;
  description?: string;
  stock?: number;
  badge?: string;
  vendorId?: string;
  vendorName?: string;
}): Promise<ProductItem> {
  const store = getStore();
  let slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const baseSlug = slug;
  let counter = 1;

  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      // Ensure unique slug
      let slugExists = true;
      while (slugExists) {
        const check = await pool.query("SELECT id FROM products WHERE slug = $1 LIMIT 1", [slug]);
        if (check.rows.length === 0) {
          slugExists = false;
        } else {
          counter++;
          slug = `${baseSlug}-${counter}`;
        }
      }

      const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const res = await pool.query(
        `INSERT INTO products (id, slug, name, category, price, image, badge, description, stock, rating, num_reviews, vendor_id, vendor_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          id,
          slug,
          data.name,
          data.category || "Blankets",
          Number(data.price) || 0,
          data.image || "/assets/cloud-throw.jpg",
          data.badge || "",
          data.description || "Hand-crocheted piece.",
          Number(data.stock) || 10,
          5,
          1,
          data.vendorId || null,
          data.vendorName || null,
        ]
      );

      const created = mapProductRow(res.rows[0]);
      // Sync memory store
      store.products.unshift(created);
      saveStore();
      return created;
    } catch (err: any) {
      console.warn("DB error in createProduct, falling back:", err.message);
    }
  }

  // Fallback
  while (store.products.some((p) => p.slug === slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const newProduct: ProductItem = {
    _id: `prod-${Date.now()}`,
    name: data.name,
    slug,
    category: data.category || "Blankets",
    price: Number(data.price) || 0,
    image: data.image || "/assets/cloud-throw.jpg",
    description: data.description || "Hand-crocheted piece.",
    stock: Number(data.stock) || 10,
    badge: data.badge || "",
    rating: 5,
    numReviews: 1,
    vendorId: data.vendorId,
    vendorName: data.vendorName,
  };

  store.products.unshift(newProduct);
  saveStore();
  return newProduct;
}

export async function updateProduct(
  slugOrId: string,
  updates: Partial<ProductItem>
): Promise<ProductItem | null> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const existingRes = await pool.query(
        "SELECT * FROM products WHERE slug = $1 OR id = $1 LIMIT 1",
        [slugOrId]
      );
      if (existingRes.rows.length === 0) return null;

      const current = existingRes.rows[0];
      const name = updates.name !== undefined ? updates.name : current.name;
      const category = updates.category !== undefined ? updates.category : current.category;
      const price = updates.price !== undefined ? Number(updates.price) : current.price;
      const stock = updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : current.stock;
      const image = updates.image !== undefined ? updates.image : current.image;
      const description = updates.description !== undefined ? updates.description : current.description;
      const badge = updates.badge !== undefined ? updates.badge : current.badge;

      const updatedRes = await pool.query(
        `UPDATE products
         SET name = $1, category = $2, price = $3, stock = $4, image = $5, description = $6, badge = $7
         WHERE id = $8
         RETURNING *`,
        [name, category, price, stock, image, description, badge, current.id]
      );

      const updated = mapProductRow(updatedRes.rows[0]);
      // Sync memory
      const store = getStore();
      const foundP = store.products.find((p) => p.slug === slugOrId || p._id === slugOrId);
      if (foundP) Object.assign(foundP, updated);
      saveStore();
      return updated;
    } catch (err: any) {
      console.warn("DB error in updateProduct:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const product = store.products.find((p) => p.slug === slugOrId || p._id === slugOrId);
  if (!product) return null;

  if (updates.stock !== undefined) product.stock = Math.max(0, Number(updates.stock));
  if (updates.price !== undefined) product.price = Number(updates.price);
  if (updates.name !== undefined) product.name = updates.name;
  if (updates.category !== undefined) product.category = updates.category;
  if (updates.image !== undefined) product.image = updates.image;
  if (updates.description !== undefined) product.description = updates.description;
  if (updates.badge !== undefined) product.badge = updates.badge;

  saveStore();
  return product;
}

export async function deleteProduct(slugOrId: string): Promise<boolean> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      await pool.query("DELETE FROM products WHERE slug = $1 OR id = $1", [slugOrId]);
    } catch (err: any) {
      console.warn("DB error in deleteProduct:", err.message);
    }
  }

  const store = getStore();
  const idx = store.products.findIndex((p) => p.slug === slugOrId || p._id === slugOrId);
  if (idx !== -1) {
    store.products.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// ============================================================================
// REVIEWS API
// ============================================================================
export async function getProductReviews(slugOrId: string) {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const prodRes = await pool.query(
        "SELECT id, rating, num_reviews FROM products WHERE slug = $1 OR id = $1 LIMIT 1",
        [slugOrId]
      );
      if (prodRes.rows.length === 0) return null;
      const p = prodRes.rows[0];

      const revRes = await pool.query(
        "SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC",
        [p.id]
      );

      const reviews: ReviewItem[] = revRes.rows.map((r) => ({
        _id: r.id,
        name: r.name,
        rating: Number(r.rating),
        comment: r.comment,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));

      return {
        rating: Number(p.rating) || 5.0,
        numReviews: Number(p.num_reviews) || reviews.length,
        reviews,
      };
    } catch (err: any) {
      console.warn("DB error in getProductReviews:", err.message);
    }
  }

  const store = getStore();
  const product = store.products.find((p) => p.slug === slugOrId || p._id === slugOrId);
  if (!product) return null;

  return {
    rating: product.rating || 5.0,
    numReviews: product.numReviews || (product.reviews ? product.reviews.length : 0),
    reviews: product.reviews || [],
  };
}

export async function addProductReview(
  slugOrId: string,
  review: { name: string; rating: number; comment: string }
) {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  const trimmedComment = review.comment.trim();
  const trimmedName = review.name?.trim() ? review.name.trim().slice(0, 80) : "Handmade Lover";
  const numRating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5)));
  const revId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  if (isConnected && pool) {
    try {
      const prodRes = await pool.query(
        "SELECT id FROM products WHERE slug = $1 OR id = $1 LIMIT 1",
        [slugOrId]
      );
      if (prodRes.rows.length > 0) {
        const prodId = prodRes.rows[0].id;

        await pool.query(
          `INSERT INTO reviews (id, product_id, name, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [revId, prodId, trimmedName, numRating, trimmedComment, new Date()]
        );

        // Recalculate rating
        const allRevRes = await pool.query(
          "SELECT rating FROM reviews WHERE product_id = $1",
          [prodId]
        );
        const allRatings = allRevRes.rows.map((r) => Number(r.rating) || 5);
        const numReviews = allRatings.length;
        const avgRating = Number(
          (allRatings.reduce((sum, r) => sum + r, 0) / (numReviews || 1)).toFixed(1)
        );

        await pool.query(
          "UPDATE products SET rating = $1, num_reviews = $2 WHERE id = $3",
          [avgRating, numReviews, prodId]
        );

        const revRows = await pool.query(
          "SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC",
          [prodId]
        );
        const reviews = revRows.rows.map((r) => ({
          _id: r.id,
          name: r.name,
          rating: Number(r.rating),
          comment: r.comment,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : now,
        }));

        return {
          message: "Review added successfully!",
          review: { _id: revId, name: trimmedName, rating: numRating, comment: trimmedComment, createdAt: now },
          rating: avgRating,
          numReviews,
          reviews,
        };
      }
    } catch (err: any) {
      console.warn("DB error in addProductReview:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const product = store.products.find((p) => p.slug === slugOrId || p._id === slugOrId);
  if (!product) throw new Error("Product not found");

  if (!Array.isArray(product.reviews)) product.reviews = [];

  const newRev: ReviewItem = {
    _id: revId,
    name: trimmedName,
    rating: numRating,
    comment: trimmedComment,
    createdAt: now,
  };

  product.reviews.unshift(newRev);
  const total = product.reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  product.numReviews = product.reviews.length;
  product.rating = Number((total / product.numReviews).toFixed(1));
  saveStore();

  return {
    message: "Review added successfully!",
    review: newRev,
    rating: product.rating,
    numReviews: product.numReviews,
    reviews: product.reviews,
  };
}

// ============================================================================
// ORDERS API
// ============================================================================
export async function getOrders(): Promise<OrderItem[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      return res.rows.map((r) => mapOrderRow(r));
    } catch (err: any) {
      console.warn("DB error in getOrders:", err.message);
    }
  }

  const store = getStore();
  return store.orders || [];
}

export async function createOrder(data: {
  customer?: { name?: string; email?: string; phone?: string };
  items: any[];
  shippingAddress: { fullName: string; street: string; city: string; postalCode?: string };
  paymentMethod?: string;
  subtotal: number;
  giftWrap?: boolean;
  total: number;
}): Promise<OrderItem> {
  const orderNumber = `#CC-${Math.floor(2000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;
  const now = new Date().toISOString();

  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone,
          shipping_full_name, shipping_street, shipping_city, shipping_postal_code,
          items, payment_method, subtotal, gift_wrap, total, status, is_paid, order_type, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          orderId,
          orderNumber,
          data.customer?.name || data.shippingAddress.fullName || "Valued Customer",
          data.customer?.email || "customer@example.com",
          data.customer?.phone || "",
          data.shippingAddress.fullName,
          data.shippingAddress.street,
          data.shippingAddress.city,
          data.shippingAddress.postalCode || "00000",
          JSON.stringify(data.items || []),
          data.paymentMethod || "WhatsApp / Direct Transfer",
          Number(data.subtotal) || 0,
          data.giftWrap !== false,
          Number(data.total) || 0,
          "Processing",
          false,
          "regular",
          new Date(),
        ]
      );

      const created = mapOrderRow(res.rows[0]);
      // Sync memory
      const store = getStore();
      store.orders.unshift(created);
      saveStore();
      return created;
    } catch (err: any) {
      console.warn("DB error in createOrder:", err.message);
    }
  }

  // Fallback
  const newOrder: OrderItem = {
    _id: orderId,
    orderNumber,
    customer: {
      name: data.customer?.name || data.shippingAddress.fullName || "Valued Customer",
      email: data.customer?.email || "customer@example.com",
      phone: data.customer?.phone || "",
    },
    items: data.items,
    shippingAddress: {
      fullName: data.shippingAddress.fullName,
      street: data.shippingAddress.street,
      city: data.shippingAddress.city,
      postalCode: data.shippingAddress.postalCode || "00000",
    },
    paymentMethod: data.paymentMethod || "WhatsApp / Direct Transfer",
    subtotal: Number(data.subtotal) || 0,
    giftWrap: Boolean(data.giftWrap),
    total: Number(data.total) || 0,
    status: "Processing",
    isPaid: false,
    orderType: "regular",
    createdAt: now,
  };

  const store = getStore();
  store.orders.unshift(newOrder);
  saveStore();
  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status?: string,
  isPaid?: boolean
): Promise<OrderItem | null> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const existingRes = await pool.query(
        "SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1",
        [id]
      );
      if (existingRes.rows.length === 0) return null;

      const current = existingRes.rows[0];
      const newStatus = status !== undefined ? status : current.status;
      const newIsPaid =
        isPaid !== undefined
          ? Boolean(isPaid)
          : status === "Paid"
          ? true
          : Boolean(current.is_paid);

      const updatedRes = await pool.query(
        "UPDATE orders SET status = $1, is_paid = $2 WHERE id = $3 RETURNING *",
        [newStatus, newIsPaid, current.id]
      );

      const updated = mapOrderRow(updatedRes.rows[0]);
      // Sync memory
      const store = getStore();
      const foundO = store.orders.find((o) => o._id === id || o.orderNumber === id);
      if (foundO) Object.assign(foundO, updated);
      saveStore();
      return updated;
    } catch (err: any) {
      console.warn("DB error in updateOrderStatus:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const order = store.orders.find((o) => o._id === id || o.orderNumber === id);
  if (!order) return null;

  if (status !== undefined) order.status = status;
  if (isPaid !== undefined) order.isPaid = Boolean(isPaid);
  else if (status === "Paid") order.isPaid = true;

  saveStore();
  return order;
}

// ============================================================================
// CUSTOM ORDERS API
// ============================================================================
export async function getCustomOrders(): Promise<CustomOrderItem[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM custom_orders ORDER BY created_at DESC");
      return res.rows.map((r) => mapCustomOrderRow(r));
    } catch (err: any) {
      console.warn("DB error in getCustomOrders:", err.message);
    }
  }

  const store = getStore();
  return store.customOrders || [];
}

export async function createCustomOrder(data: {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  productType: string;
  colorPreference?: string;
  sizeDimensions?: string;
  designStyle?: string;
  quantity?: number;
  referenceImage?: string;
  instructions?: string;
  estimatedBudget?: string;
  targetDate?: string;
}): Promise<CustomOrderItem> {
  const customOrderId = `#CUST-${Math.floor(100 + Math.random() * 900)}`;
  const orderId = `cust-${Date.now()}`;
  const now = new Date().toISOString();

  const cleanEmail =
    data.customerEmail?.trim() ||
    `customer-${data.customerPhone.replace(/\D/g, "").slice(-7) || Date.now()}@cozycrochet.com`;

  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO custom_orders (id, custom_order_id, customer_name, customer_email, customer_phone,
          product_type, color_preference, size_dimensions, design_style, quantity,
          reference_image, instructions, estimated_budget, target_date, status, is_paid, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          orderId,
          customOrderId,
          data.customerName,
          cleanEmail,
          data.customerPhone,
          data.productType,
          data.colorPreference || "Custom choice",
          data.sizeDimensions || "Standard",
          data.designStyle || "Makers Choice",
          Number(data.quantity) || 1,
          data.referenceImage || "",
          data.instructions || "",
          data.estimatedBudget || "",
          data.targetDate || "",
          "New",
          false,
          new Date(),
        ]
      );

      const created = mapCustomOrderRow(res.rows[0]);
      // Sync memory
      const store = getStore();
      if (!store.customOrders) store.customOrders = [];
      store.customOrders.unshift(created);
      saveStore();
      return created;
    } catch (err: any) {
      console.warn("DB error in createCustomOrder:", err.message);
    }
  }

  // Fallback
  const newCustomOrder: CustomOrderItem = {
    _id: orderId,
    customOrderId,
    customerName: data.customerName,
    customerEmail: cleanEmail,
    customerPhone: data.customerPhone,
    productType: data.productType,
    colorPreference: data.colorPreference || "Custom choice",
    sizeDimensions: data.sizeDimensions || "Standard",
    designStyle: data.designStyle || "Makers Choice",
    quantity: Number(data.quantity) || 1,
    referenceImage: data.referenceImage || "",
    instructions: data.instructions || "",
    estimatedBudget: data.estimatedBudget || "",
    targetDate: data.targetDate || "",
    status: "New",
    createdAt: now,
  };

  const store = getStore();
  if (!store.customOrders) store.customOrders = [];
  store.customOrders.unshift(newCustomOrder);
  saveStore();
  return newCustomOrder;
}

export async function updateCustomOrderStatus(
  id: string,
  status?: string,
  isPaid?: boolean
): Promise<CustomOrderItem | null> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const existingRes = await pool.query(
        "SELECT * FROM custom_orders WHERE id = $1 OR custom_order_id = $1 LIMIT 1",
        [id]
      );
      if (existingRes.rows.length === 0) return null;

      const current = existingRes.rows[0];
      const newStatus = status !== undefined ? status : current.status;
      const newIsPaid = isPaid !== undefined ? Boolean(isPaid) : Boolean(current.is_paid);

      const updatedRes = await pool.query(
        "UPDATE custom_orders SET status = $1, is_paid = $2 WHERE id = $3 RETURNING *",
        [newStatus, newIsPaid, current.id]
      );

      const updated = mapCustomOrderRow(updatedRes.rows[0]);
      // Sync memory
      const store = getStore();
      const foundCo = store.customOrders.find((o) => o._id === id || o.customOrderId === id);
      if (foundCo) Object.assign(foundCo, updated);
      saveStore();
      return updated;
    } catch (err: any) {
      console.warn("DB error in updateCustomOrderStatus:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const order = store.customOrders.find((o) => o._id === id || o.customOrderId === id);
  if (!order) return null;

  if (status !== undefined) order.status = status;
  if (isPaid !== undefined) (order as any).isPaid = Boolean(isPaid);
  saveStore();
  return order;
}

// ============================================================================
// AUTH & USERS API
// ============================================================================
export async function findUserByEmail(email: string): Promise<UserItem | null> {
  const cleanEmail = email.trim().toLowerCase();
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [
        cleanEmail,
      ]);
      if (res.rows.length > 0) return mapUserRow(res.rows[0]);
    } catch (err: any) {
      console.warn("DB error in findUserByEmail:", err.message);
    }
  }

  const store = getStore();
  const u = store.users.find((user) => user.email.toLowerCase() === cleanEmail);
  return u || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  shopName?: string;
  shopBio?: string;
}): Promise<UserItem> {
  const cleanEmail = data.email.trim().toLowerCase();
  const userId = `usr-${Date.now()}`;
  const now = new Date().toISOString();

  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO users (id, name, email, password, role, phone, shop_name, shop_bio, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          userId,
          data.name.trim() || "Valued Customer",
          cleanEmail,
          data.password || "password123",
          data.role || "buyer",
          data.phone?.trim() || "",
          data.shopName || null,
          data.shopBio || null,
          "approved",
          new Date(),
        ]
      );

      const created = mapUserRow(res.rows[0]);
      // Sync memory
      const store = getStore();
      store.users.push(created);
      saveStore();
      return created;
    } catch (err: any) {
      console.warn("DB error in createUser:", err.message);
    }
  }

  // Fallback
  const newUser: UserItem = {
    _id: userId,
    name: data.name?.trim() || "Valued Customer",
    email: cleanEmail,
    password: data.password || "password123",
    phone: data.phone?.trim() || "",
    role: data.role || "buyer",
    shopName: data.shopName,
    shopBio: data.shopBio,
    status: "approved",
    createdAt: now,
  };

  const store = getStore();
  store.users.push(newUser);
  saveStore();
  return newUser;
}

export async function getUsers(): Promise<UserItem[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
      return res.rows.map((r) => mapUserRow(r));
    } catch (err: any) {
      console.warn("DB error in getUsers:", err.message);
    }
  }

  const store = getStore();
  return store.users || [];
}

export async function updateVendorStatus(
  vendorId: string,
  status: VendorStatus
): Promise<UserItem | null> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        "UPDATE users SET status = $1 WHERE id = $2 AND role = 'vendor' RETURNING *",
        [status, vendorId]
      );
      if (res.rows.length > 0) {
        const updated = mapUserRow(res.rows[0]);
        // Sync memory
        const store = getStore();
        const foundU = store.users.find((u) => u._id === vendorId);
        if (foundU) foundU.status = status;
        saveStore();
        return updated;
      }
    } catch (err: any) {
      console.warn("DB error in updateVendorStatus:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const vendor = store.users.find((u) => u._id === vendorId && u.role === "vendor");
  if (!vendor) return null;
  vendor.status = status;
  saveStore();
  return vendor;
}

// ============================================================================
// INVENTORY API
// ============================================================================
export async function getInventory(): Promise<any[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM inventory ORDER BY created_at DESC");
      return res.rows.map((r) => ({
        _id: r.id,
        id: r.id,
        item: r.item,
        type: r.type,
        onHand: Number(r.on_hand),
        level: r.level,
      }));
    } catch (err: any) {
      console.warn("DB error in getInventory:", err.message);
    }
  }

  const store = getStore();
  return store.inventory || [];
}

export async function addInventoryItem(data: {
  item: string;
  type: string;
  onHand: number;
  level?: string;
}) {
  const id = `inv-${Date.now()}`;
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO inventory (id, item, type, on_hand, level)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, data.item, data.type, Number(data.onHand) || 0, data.level || "Healthy"]
      );
      const r = res.rows[0];
      const newItem = {
        _id: r.id,
        id: r.id,
        item: r.item,
        type: r.type,
        onHand: Number(r.on_hand),
        level: r.level,
      };

      const store = getStore();
      if (!store.inventory) store.inventory = [];
      store.inventory.push(newItem);
      saveStore();
      return newItem;
    } catch (err: any) {
      console.warn("DB error in addInventoryItem:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const newItem = {
    _id: id,
    item: data.item,
    type: data.type,
    onHand: Number(data.onHand) || 0,
    level: data.level || "Healthy",
  };
  if (!store.inventory) store.inventory = [];
  store.inventory.push(newItem);
  saveStore();
  return newItem;
}

export async function updateInventoryItem(
  id: string,
  updates: { item?: string; type?: string; onHand?: number; level?: string }
) {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const existing = await pool.query("SELECT * FROM inventory WHERE id = $1 LIMIT 1", [id]);
      if (existing.rows.length > 0) {
        const curr = existing.rows[0];
        const item = updates.item !== undefined ? updates.item : curr.item;
        const type = updates.type !== undefined ? updates.type : curr.type;
        const onHand = updates.onHand !== undefined ? Number(updates.onHand) : curr.on_hand;
        const level = updates.level !== undefined ? updates.level : curr.level;

        const res = await pool.query(
          "UPDATE inventory SET item = $1, type = $2, on_hand = $3, level = $4 WHERE id = $5 RETURNING *",
          [item, type, onHand, level, id]
        );
        const r = res.rows[0];
        const updated = {
          _id: r.id,
          id: r.id,
          item: r.item,
          type: r.type,
          onHand: Number(r.on_hand),
          level: r.level,
        };

        const store = getStore();
        const idx = store.inventory?.findIndex((i: any) => i._id === id);
        if (idx !== -1 && idx !== undefined) store.inventory[idx] = updated;
        saveStore();
        return updated;
      }
    } catch (err: any) {
      console.warn("DB error in updateInventoryItem:", err.message);
    }
  }

  // Fallback
  const store = getStore();
  const invItem = store.inventory?.find((i: any) => i._id === id);
  if (!invItem) return null;
  if (updates.onHand !== undefined) invItem.onHand = updates.onHand;
  if (updates.level !== undefined) invItem.level = updates.level;
  if (updates.item !== undefined) invItem.item = updates.item;
  if (updates.type !== undefined) invItem.type = updates.type;
  saveStore();
  return invItem;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      await pool.query("DELETE FROM inventory WHERE id = $1", [id]);
    } catch (err: any) {
      console.warn("DB error in deleteInventoryItem:", err.message);
    }
  }

  const store = getStore();
  const idx = store.inventory?.findIndex((i: any) => i._id === id);
  if (idx !== -1 && idx !== undefined) {
    store.inventory.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// ============================================================================
// MESSAGES / CONTACT API
// ============================================================================
export async function getMessages(): Promise<any[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
      return res.rows.map((r) => ({
        _id: r.id,
        id: r.id,
        name: r.name,
        phone: r.phone || "",
        email: r.email || "",
        message: r.message,
        read: Boolean(r.read),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err: any) {
      console.warn("DB error in getMessages:", err.message);
    }
  }

  const store = getStore() as any;
  return store.messages || [];
}

export async function addMessage(data: {
  name: string;
  phone?: string;
  email?: string;
  message: string;
}) {
  const id = `msg-${Date.now()}`;
  const now = new Date().toISOString();
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO messages (id, name, phone, email, message, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          data.name.trim(),
          (data.phone || data.email || "").trim(),
          (data.email || data.phone || "Via Website").trim(),
          data.message.trim(),
          false,
          new Date(),
        ]
      );
      const r = res.rows[0];
      const newMsg = {
        _id: r.id,
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message,
        read: Boolean(r.read),
        createdAt: now,
      };

      const store = getStore() as any;
      if (!store.messages) store.messages = [];
      store.messages.unshift(newMsg);
      saveStore();
      return newMsg;
    } catch (err: any) {
      console.warn("DB error in addMessage:", err.message);
    }
  }

  // Fallback
  const store = getStore() as any;
  if (!store.messages) store.messages = [];
  const newMsg = {
    _id: id,
    name: data.name.trim(),
    phone: (data.phone || data.email || "").trim(),
    email: (data.email || data.phone || "Via Website").trim(),
    message: data.message.trim(),
    createdAt: now,
    read: false,
  };
  store.messages.unshift(newMsg);
  saveStore();
  return newMsg;
}

export async function deleteMessages(id?: string): Promise<boolean> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      if (id) {
        await pool.query("DELETE FROM messages WHERE id = $1", [id]);
      } else {
        await pool.query("DELETE FROM messages");
      }
    } catch (err: any) {
      console.warn("DB error in deleteMessages:", err.message);
    }
  }

  const store = getStore() as any;
  if (id) {
    store.messages = (store.messages || []).filter((m: any) => m._id !== id);
  } else {
    store.messages = [];
  }
  saveStore();
  return true;
}

// ============================================================================
// SUBSCRIBERS / NEWSLETTER API
// ============================================================================
export async function getSubscribers(): Promise<{ email: string; date: string }[]> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const res = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
      return res.rows.map((r) => ({
        email: r.email,
        date: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err: any) {
      console.warn("DB error in getSubscribers:", err.message);
    }
  }

  const store = getStore();
  return store.subscribers || [];
}

export async function addSubscriber(email: string): Promise<{ isNew: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      const check = await pool.query("SELECT id FROM subscribers WHERE LOWER(email) = $1 LIMIT 1", [
        cleanEmail,
      ]);
      if (check.rows.length === 0) {
        await pool.query(
          "INSERT INTO subscribers (id, email, created_at) VALUES ($1, $2, $3)",
          [`sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, cleanEmail, new Date()]
        );
      }
    } catch (err: any) {
      console.warn("DB error in addSubscriber:", err.message);
    }
  }

  const store = getStore();
  if (!store.subscribers) store.subscribers = [];
  const existing = store.subscribers.find((s) => s.email.toLowerCase() === cleanEmail);
  if (!existing) {
    store.subscribers.unshift({
      email: cleanEmail,
      date: new Date().toISOString(),
    });
    saveStore();
    return { isNew: true };
  }
  return { isNew: false };
}

// ============================================================================
// ADMIN & ANALYTICS API
// ============================================================================
export async function clearDemoOrders(): Promise<boolean> {
  const isConnected = await ensureDbInitialized();
  const pool = getPool();

  if (isConnected && pool) {
    try {
      await pool.query("DELETE FROM orders");
      await pool.query("DELETE FROM custom_orders WHERE custom_order_id = '#CUST-101'");
    } catch (err: any) {
      console.warn("DB error in clearDemoOrders:", err.message);
    }
  }

  const store = getStore();
  store.orders = [];
  store.customOrders = (store.customOrders || []).filter((o) => o.customOrderId !== "#CUST-101");
  saveStore();
  return true;
}

export async function getAnalytics() {
  const orders = await getOrders();
  const customOrders = await getCustomOrders();
  const products = await getProducts();

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length;
  const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";
  const lowStockCount = products.filter((p) => Number(p.stock) < 10).length;

  const productSalesMap = new Map<string, { name: string; sales: number; count: number }>();
  orders.forEach((o) => {
    (o.items || []).forEach((item: any) => {
      const key = item.slug || item.name;
      const existing = productSalesMap.get(key) || { name: item.name, sales: 0, count: 0 };
      existing.sales += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      existing.count += Number(item.quantity) || 1;
      productSalesMap.set(key, existing);
    });
  });

  let topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.sales - a.sales)
    .map((p) => ({
      name: p.name,
      sales: `$${p.sales.toLocaleString()}`,
      percentage: totalRevenue > 0 ? `${Math.round((p.sales / totalRevenue) * 100)}%` : "0%",
      unitsSold: p.count,
    }));

  if (topProducts.length === 0) {
    topProducts = products.slice(0, 4).map((p, idx) => ({
      name: p.name,
      sales: `$${(p.price * (15 - idx * 3)).toLocaleString()}`,
      percentage: `${35 - idx * 7}%`,
      unitsSold: 15 - idx * 3,
    }));
  }

  const categoryCount: Record<string, number> = {};
  products.forEach((p) => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });

  const customStatusCount: Record<string, number> = {
    New: 0,
    "Under Review": 0,
    Quoted: 0,
    "In Progress": 0,
    Completed: 0,
  };
  customOrders.forEach((co) => {
    const s = co.status || "New";
    customStatusCount[s] = (customStatusCount[s] || 0) + 1;
  });

  return {
    revenue: `$${totalRevenue.toLocaleString()}`,
    rawRevenue: totalRevenue,
    orders: totalOrders,
    customOrdersCount: customOrders.length,
    averageOrder: `$${averageOrder}`,
    lowStock: lowStockCount,
    totalProducts: products.length,
    monthlyBars: [38, 52, 45, 68, 72, 85, 78, 95, 90, 115, 105, 128],
    topProducts,
    categoryCount,
    customStatusCount,
  };
}
