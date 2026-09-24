import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "db_fallback.json");

const initialData = {
  products: [
    {
      _id: "prod-1",
      slug: "cloud-stripe-throw",
      name: "Cloud Stripe Throw",
      category: "Blankets",
      price: 84,
      image: "/src/assets/cloud-throw.jpg",
      badge: "Bestseller",
      description: "A weighty, cloud-soft throw worked by hand in warm cotton and muted sage.",
      stock: 18,
      rating: 5,
      numReviews: 32,
    },
    {
      _id: "prod-2",
      slug: "everyday-market-tote",
      name: "Everyday Market Tote",
      category: "Bags",
      price: 42,
      image: "/src/assets/market-tote.jpg",
      badge: "New",
      description: "An airy cotton market bag with sturdy handles and room for everyday essentials.",
      stock: 26,
      rating: 5,
      numReviews: 24,
    },
    {
      _id: "prod-3",
      slug: "honey-bunny",
      name: "Honey Bunny",
      category: "Amigurumi",
      price: 36,
      image: "/src/assets/honey-bunny.jpg",
      badge: "Favorite",
      description: "A keepsake bunny stitched in soft cotton and finished with a tiny clay scarf.",
      stock: 12,
      rating: 5,
      numReviews: 19,
    },
    {
      _id: "prod-4",
      slug: "ridgeline-beanie",
      name: "Ridgeline Beanie",
      category: "Wear",
      price: 38,
      image: "/src/assets/ridgeline-beanie.jpg",
      badge: "Warmth",
      description: "A warm ribbed beanie with a flexible cuff, hand-finished in sage merino.",
      stock: 7,
      rating: 4.9,
      numReviews: 14,
    },
    {
      _id: "prod-5",
      slug: "meadow-picnic-throw",
      name: "Meadow Picnic Throw",
      category: "Blankets",
      price: 96,
      image: "/src/assets/cloud-throw.jpg",
      badge: "",
      description: "A generous heirloom throw in earthy stripes for slow afternoons outdoors.",
      stock: 9,
      rating: 5,
      numReviews: 8,
    },
    {
      _id: "prod-6",
      slug: "willow-studio-bag",
      name: "Willow Studio Bag",
      category: "Bags",
      price: 48,
      image: "/src/assets/market-tote.jpg",
      badge: "",
      description: "A softly structured carryall for yarn, books and market mornings.",
      stock: 16,
      rating: 4.8,
      numReviews: 11,
    },
    {
      _id: "prod-7",
      slug: "little-fern-friend",
      name: "Little Fern Friend",
      category: "Amigurumi",
      price: 32,
      image: "/src/assets/honey-bunny.jpg",
      badge: "Handmade",
      description: "A pocket-sized companion made slowly from natural cotton remnants.",
      stock: 21,
      rating: 5,
      numReviews: 16,
    },
    {
      _id: "prod-8",
      slug: "morning-mist-beanie",
      name: "Morning Mist Beanie",
      category: "Wear",
      price: 40,
      image: "/src/assets/ridgeline-beanie.jpg",
      badge: "",
      description: "A close, cosy fit in a calm sage shade with a tactile ribbed finish.",
      stock: 14,
      rating: 4.9,
      numReviews: 10,
    },
  ],
  orders: [
    {
      _id: "ord-1",
      orderNumber: "#CC-2047",
      customer: { name: "Ava Lewis", email: "ava@example.com", phone: "+1 555-0192" },
      items: [
        {
          slug: "cloud-stripe-throw",
          name: "Cloud Stripe Throw",
          price: 84,
          quantity: 1,
          image: "/src/assets/cloud-throw.jpg",
        },
      ],
      shippingAddress: {
        fullName: "Ava Lewis",
        street: "742 Evergreen Terrace",
        city: "Portland",
        postalCode: "97201",
      },
      paymentMethod: "Card",
      subtotal: 84,
      giftWrap: true,
      total: 84,
      status: "Paid",
      isPaid: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      _id: "ord-2",
      orderNumber: "#CC-2046",
      customer: { name: "Noor Ali", email: "noor@example.com", phone: "+1 555-0145" },
      items: [
        {
          slug: "honey-bunny",
          name: "Honey Bunny",
          price: 36,
          quantity: 1,
          image: "/src/assets/honey-bunny.jpg",
        },
      ],
      shippingAddress: {
        fullName: "Noor Ali",
        street: "12 Meadow Lane",
        city: "Seattle",
        postalCode: "98101",
      },
      paymentMethod: "Card",
      subtotal: 36,
      giftWrap: true,
      total: 36,
      status: "Packing",
      isPaid: true,
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      _id: "ord-3",
      orderNumber: "#CC-2045",
      customer: { name: "Sara Khan", email: "sara@example.com", phone: "+1 555-0188" },
      items: [
        {
          slug: "everyday-market-tote",
          name: "Everyday Market Tote",
          price: 42,
          quantity: 2,
          image: "/src/assets/market-tote.jpg",
        },
      ],
      shippingAddress: {
        fullName: "Sara Khan",
        street: "88 Willow Creek Dr",
        city: "Austin",
        postalCode: "78701",
      },
      paymentMethod: "Card",
      subtotal: 84,
      giftWrap: true,
      total: 84,
      status: "Shipped",
      isPaid: true,
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    },
  ],
  customOrders: [
    {
      _id: "cust-1",
      customOrderId: "#CUST-101",
      customerName: "Zainab Fatima",
      customerEmail: "zainab@example.com",
      customerPhone: "+92 300 1234567",
      productType: "Blanket",
      colorPreference: "Sage & Ivory Terracotta borders",
      sizeDimensions: "Queen Size (60x80 inches)",
      designStyle: "Waffle Stitch with scalloped edge",
      quantity: 1,
      referenceImage: "",
      instructions: "Please make it weighty with pure organic cotton yarn for winter gifting.",
      estimatedBudget: "$120 - $150",
      targetDate: "Next Month",
      status: "New",
      createdAt: new Date().toISOString(),
    },
  ],
  inventory: [
    { _id: "inv-1", item: "Sage merino", type: "Yarn · 4mm", onHand: "18 skeins", level: "Low" },
    { _id: "inv-2", item: "Cream cotton", type: "Yarn · 2mm", onHand: "9 skeins", level: "Critical" },
    { _id: "inv-3", item: "Clay alpaca", type: "Yarn · 5mm", onHand: "42 skeins", level: "Healthy" },
    { _id: "inv-4", item: "Kraft gift boxes", type: "Packaging", onHand: "63 units", level: "Healthy" },
    { _id: "inv-5", item: "Cotton labels", type: "Finishing", onHand: "24 units", level: "Low" },
  ],
  users: [
    {
      _id: "usr-admin",
      name: "Maya (Studio Maker)",
      email: "admin@cozycrochet.com",
      password: "adminpassword123",
      role: "admin",
      phone: "+1 555-0100",
    },
    {
      _id: "usr-demo",
      name: "Ava Lewis",
      email: "ava@example.com",
      password: "password123",
      role: "customer",
      phone: "+1 555-0192",
    },
  ],
};

// In-Memory store initialized with saved or default data
let memoryStore = { ...initialData };

export const loadStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      memoryStore = JSON.parse(data);
    }
  } catch {
    memoryStore = { ...initialData };
  }
  return memoryStore;
};

export const saveStore = () => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save to file store, staying in-memory:", err.message);
  }
};

loadStore();

export const getStore = () => memoryStore;
