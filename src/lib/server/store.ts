import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "server", "data", "db_fallback.json");

export type ReviewItem = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductItem = {
  _id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  badge?: string;
  description: string;
  stock: number;
  rating?: number;
  numReviews?: number;
  reviews?: ReviewItem[];
  vendorId?: string;
  vendorName?: string;
};

export type UserRole = "buyer" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "rejected";

export type UserItem = {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  shopName?: string;
  shopBio?: string;
  status?: VendorStatus;
  createdAt: string;
};

export type OrderItem = {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  items: { slug: string; name: string; price: number; quantity: number; image: string }[];
  shippingAddress: { fullName: string; street: string; city: string; postalCode: string };
  paymentMethod: string;
  subtotal: number;
  giftWrap: boolean;
  total: number;
  status: string;
  isPaid: boolean;
  orderType?: "regular" | "custom";
  createdAt: string;
};

export type CustomOrderItem = {
  _id: string;
  customOrderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productType: string;
  colorPreference: string;
  sizeDimensions: string;
  designStyle: string;
  quantity: number;
  referenceImage?: string;
  instructions?: string;
  estimatedBudget?: string;
  targetDate?: string;
  status: string;
  isPaid?: boolean;
  createdAt: string;
};

export type StoreData = {
  products: ProductItem[];
  orders: OrderItem[];
  customOrders: CustomOrderItem[];
  inventory: any[];
  users: UserItem[];
  subscribers?: { email: string; date: string }[];
  messages?: any[];
};

const initialData: StoreData = {
  subscribers: [],
  products: [],
  orders: [],
  customOrders: [],
  inventory: [],
  messages: [],
  users: [
    {
      _id: "usr-admin",
      name: "AJ (Studio Maker)",
      email: "admin@cozycrochet.com",
      password: "adminpassword123",
      role: "admin",
      phone: "+92 300 0000000",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
};

const TMP_FILE = path.join(typeof process !== "undefined" && process.platform === "win32" ? process.cwd() : "/tmp", "cozy_crochet_runtime.json");

let memoryStore: StoreData | null = null;

export const loadStore = (): StoreData => {
  try {
    // 1. Try to load from runtime file first (persists dynamic changes on Vercel!)
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        memoryStore = parsed;
        return memoryStore!;
      }
    }
  } catch {}

  try {
    // 2. Otherwise load baseline from git repository data file
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      memoryStore = JSON.parse(data);
    }
  } catch (err: any) {
    console.warn("Could not load DATA_FILE:", err.message);
  }

  if (!memoryStore) {
    memoryStore = { ...initialData, messages: [] };
  }
  if (!memoryStore.messages) {
    memoryStore.messages = [];
  }
  return memoryStore;
};

export const saveStore = () => {
  if (!memoryStore) return;
  // 1. Try writing to local repository file (works in local dev)
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch {
    // Expected on Vercel read-only filesystem
  }

  // 2. Always write to runtime file (persists on Vercel lambda container!)
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("Could not save to runtime file:", err.message);
  }
};

export const getStore = (): StoreData => {
  if (!memoryStore) {
    loadStore();
  }
  return memoryStore!;
};

export const sendNotification = (orderData: any) => {
  const summary = `
=============================================
🧶 NEW CUSTOM CROCHET ORDER RECEIVED! 🧶
=============================================
Order ID:       ${orderData.customOrderId}
Date:           ${new Date().toLocaleString()}
Customer:       ${orderData.customerName}
Email:          ${orderData.customerEmail}
Phone/WhatsApp: ${orderData.customerPhone}

Product Type:   ${orderData.productType}
Quantity:       ${orderData.quantity || 1}
Color Palette:  ${orderData.colorPreference}
Dimensions:     ${orderData.sizeDimensions}
Stitch Style:   ${orderData.designStyle}
Urgency / Date: ${orderData.targetDate || "Not specified"}
Reference Pic:  ${orderData.referenceImage ? "Yes (Attached in order details)" : "None"}

Customer Instructions:
${orderData.instructions || "None provided"}
=============================================
`;
  console.log(summary);

  const whatsappText = `🌸 *The Cozy Crochet - Custom Order Request* 🌸
• *Order ID:* ${orderData.customOrderId}
• *Product:* ${orderData.productType} (Qty: ${orderData.quantity || 1})
• *Colors:* ${orderData.colorPreference}
• *Size:* ${orderData.sizeDimensions}
• *Style:* ${orderData.designStyle}
• *Instructions:* ${orderData.instructions || "None"}
• *Customer:* ${orderData.customerName}
• *Email:* ${orderData.customerEmail}
• *Phone:* ${orderData.customerPhone}

[The Cozy Crochet - Custom Order]`;

  const whatsappUrl = `https://wa.me/923207309867?text=${encodeURIComponent(whatsappText)}`;

  return {
    whatsappUrl,
    emailSent: true,
    summary,
  };
};
