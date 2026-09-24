-- ============================================================
-- THE COZY CROCHET - Supabase Database Setup
-- Run this ENTIRE file in: Supabase > SQL Editor > New Query
-- ============================================================

-- 1. PRODUCTS TABLE
create table if not exists products (
  id text primary key default ('prod-' || extract(epoch from now())::bigint::text),
  slug text unique not null,
  name text not null,
  category text not null default 'Blankets',
  price numeric not null default 0,
  image text not null default '/assets/cloud-throw.jpg',
  badge text default '',
  description text default 'Hand-crocheted piece.',
  stock integer not null default 10,
  rating numeric default 5,
  num_reviews integer default 0,
  vendor_id text default null,
  vendor_name text default null,
  created_at timestamptz default now()
);

-- 2. ORDERS TABLE
create table if not exists orders (
  id text primary key default ('ord-' || extract(epoch from now())::bigint::text),
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text default '',
  shipping_full_name text not null,
  shipping_street text not null,
  shipping_city text not null,
  shipping_postal_code text not null,
  items jsonb not null default '[]',
  payment_method text default 'WhatsApp / Direct Transfer',
  subtotal numeric not null default 0,
  gift_wrap boolean default true,
  total numeric not null default 0,
  status text not null default 'Processing',
  is_paid boolean default false,
  order_type text not null default 'regular',
  created_at timestamptz default now()
);

-- 3. CUSTOM ORDERS TABLE
create table if not exists custom_orders (
  id text primary key default ('cust-' || extract(epoch from now())::bigint::text),
  custom_order_id text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  product_type text not null,
  color_preference text default 'Custom choice',
  size_dimensions text default 'Standard',
  design_style text default 'Makers Choice',
  quantity integer default 1,
  reference_image text default '',
  instructions text default '',
  estimated_budget text default '',
  target_date text default '',
  status text not null default 'New',
  is_paid boolean default false,
  created_at timestamptz default now()
);

-- 4. USERS TABLE
create table if not exists users (
  id text primary key default ('usr-' || extract(epoch from now())::bigint::text),
  name text not null,
  email text unique not null,
  password text default 'password123',
  role text not null default 'buyer',
  phone text default '',
  shop_name text default null,
  shop_bio text default null,
  status text default 'approved',
  created_at timestamptz default now()
);

-- 5. SUBSCRIBERS TABLE
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- 6. REVIEWS TABLE
create table if not exists reviews (
  id text primary key default ('rev-' || extract(epoch from now())::bigint::text),
  product_id text references products(id) on delete cascade,
  name text not null,
  rating integer not null,
  comment text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA: Default Admin User
-- ============================================================
insert into users (id, name, email, password, role, phone, status)
values 
  ('usr-admin', 'AJ (Studio Maker)', 'admin@cozycrochet.com', 'adminpassword123', 'admin', '+92 300 0000000', 'approved'),
  ('usr-admin-arbab', 'AJ (Studio Maker)', 'arbabjabeen2006@gmail.com', 'aj1234qwerty', 'admin', '+92 320 7309867', 'approved')
on conflict (email) do nothing;

-- 7. MESSAGES TABLE (Contact form)
create table if not exists messages (
  id text primary key default ('msg-' || extract(epoch from now())::bigint::text),
  name text not null,
  phone text default '',
  email text default '',
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. INVENTORY TABLE
create table if not exists inventory (
  id text primary key default ('inv-' || extract(epoch from now())::bigint::text),
  item text not null,
  type text not null,
  on_hand integer not null default 0,
  level text not null default 'Healthy',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Disabled (we use server connection)
-- ============================================================
alter table products disable row level security;
alter table orders disable row level security;
alter table custom_orders disable row level security;
alter table users disable row level security;
alter table subscribers disable row level security;
alter table reviews disable row level security;
alter table messages disable row level security;
alter table inventory disable row level security;
