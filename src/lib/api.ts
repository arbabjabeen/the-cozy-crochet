import { type Product, products as fallbackProducts } from "./catalog";

const API_BASE = "/api";

// In-memory cache for ultra-fast instant navigation
let inMemoryProductsCache: Product[] | null = null;
let activeFetchPromise: Promise<Product[]> | null = null;

function getCachedProducts(): Product[] | null {
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return inMemoryProductsCache;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("cozy_cached_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryProductsCache = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return fallbackProducts;
}

function saveCachedProducts(products: Product[]) {
  if (!products || products.length === 0) return;
  inMemoryProductsCache = products;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("cozy_cached_products", JSON.stringify(products));
    } catch {
      // ignore
    }
  }
}

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const hasFilter = Boolean((category && category !== "All") || (search && search.trim()));

  // If no filter (full catalog), return cache instantly (0ms) and revalidate quietly in background!
  if (!hasFilter) {
    const cached = getCachedProducts();

    if (!activeFetchPromise) {
      activeFetchPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${API_BASE}/products`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const fresh = await res.json();
            if (Array.isArray(fresh) && fresh.length > 0) {
              saveCachedProducts(fresh);
              return fresh;
            }
          }
        } catch {
          // ignore background error
        } finally {
          activeFetchPromise = null;
        }
        return inMemoryProductsCache || fallbackProducts;
      })();
    }

    if (cached && cached.length > 0) {
      return cached;
    }

    return activeFetchPromise;
  }

  // If filtered by category or search term
  try {
    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (search) params.append("search", search);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // fallback
  }

  // Filter in-memory fallback
  const base = getCachedProducts() || fallbackProducts;
  return base.filter((p) => {
    const matchesCat = !category || category === "All" || p.category.toLowerCase() === category.toLowerCase();
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  const cachedList = getCachedProducts() || fallbackProducts;
  const found = cachedList.find((p) => p.slug === slug);
  if (found) {
    // Return immediately so the page opens in 0ms!
    return found;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}/products/${slug}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return found;
}

export async function addProduct(product: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    slug: product.slug || (product.name ? product.name.toLowerCase().replace(/\s+/g, "-") : "new-piece"),
    name: product.name || "Untitled Crochet Piece",
    category: product.category || "Blankets",
    price: product.price || 50,
    image: product.image || "/assets/cloud-throw.jpg",
    description: product.description || "Handmade with soft fibres.",
    stock: product.stock || 10,
    ...(product.badge ? { badge: product.badge } : {}),
  };
}

export async function updateProductApi(idOrSlug: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return null;
}

export async function deleteProductApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return true;
  }
}

// ORDERS
export type OrderPayload = {
  customer?: { name: string; email: string; phone?: string };
  items: { slug: string; name: string; price: number; quantity: number; image: string }[];
  shippingAddress: { fullName: string; street: string; city: string; postalCode: string };
  paymentMethod?: string;
  subtotal: number;
  giftWrap?: boolean;
  total: number;
};

export async function placeOrder(order: OrderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    orderNumber: `#CC-${Math.floor(2000 + Math.random() * 9000)}`,
    status: "Pending",
    isPaid: false,
    ...order,
  };
}

export async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function updateOrderStatusApi(
  id: string,
  params: string | { status?: string; isPaid?: boolean },
  maybeIsPaid?: boolean
) {
  try {
    const payload =
      typeof params === "string"
        ? { status: params, ...(maybeIsPaid !== undefined ? { isPaid: maybeIsPaid } : {}) }
        : params;

    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return typeof params === "string" ? { id, status: params } : { id, ...params };
}

// CUSTOM ORDERS ("Customize According to Your Choice")
export type CustomOrderPayload = {
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
};

export async function submitCustomOrder(payload: CustomOrderPayload) {
  try {
    const res = await fetch(`${API_BASE}/custom-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  const customOrderId = `#CUST-${Math.floor(100 + Math.random() * 900)}`;
  const whatsappMessage = encodeURIComponent(
    `Hello AJ! 🌸\nI submitted custom order ${customOrderId}:\n• Item: ${payload.productType}\n• Color: ${payload.colorPreference}\n• Quantity: ${payload.quantity}\n• Name: ${payload.customerName}\n• Phone: ${payload.customerPhone}\n\n[The Cozy Crochet - Custom Order]`
  );
  return {
    success: true,
    customOrder: {
      customOrderId,
      status: "New",
      createdAt: new Date().toISOString(),
      ...payload,
    },
    whatsappUrl: `https://wa.me/923207309867?text=${whatsappMessage}`,
  };
}

export async function fetchCustomOrders() {
  try {
    const res = await fetch(`${API_BASE}/custom-orders`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function updateCustomOrderStatusApi(
  id: string,
  params: string | { status?: string; isPaid?: boolean },
  maybeIsPaid?: boolean
) {
  try {
    const payload =
      typeof params === "string"
        ? { status: params, ...(maybeIsPaid !== undefined ? { isPaid: maybeIsPaid } : {}) }
        : params;

    const res = await fetch(`${API_BASE}/custom-orders/${encodeURIComponent(id)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return typeof params === "string" ? { id, status: params } : { id, ...params };
}

// INVENTORY & ANALYTICS
export async function fetchInventory() {
  try {
    const res = await fetch(`${API_BASE}/inventory`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function fetchAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    revenue: "$0.00",
    rawRevenue: 0,
    orders: 0,
    customOrdersCount: 0,
    averageOrder: "$0.00",
    lowStock: 0,
    totalProducts: 0,
    monthlyBars: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    topProducts: [],
    categoryCount: {},
    customStatusCount: { New: 0, "Under Review": 0, Quoted: 0, "In Progress": 0, Completed: 0 },
  };
}

// REVIEWS
export async function addProductReview(
  slug: string,
  review: { name: string; rating: number; comment: string }
): Promise<{ success: boolean; review?: any; rating?: number; numReviews?: number; reviews?: any[]; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, ...data };
    }
    return { success: false, message: data.message || "Failed to submit review" };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error" };
  }
}

export async function fetchProductReviews(
  slug: string
): Promise<{ rating: number; numReviews: number; reviews: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/reviews`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { rating: 5.0, numReviews: 0, reviews: [] };
}

