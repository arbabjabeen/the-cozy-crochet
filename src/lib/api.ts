import { type Product, products as fallbackProducts } from "./catalog";

const API_BASE = "/api";

// In-memory & localStorage cache for instant navigation and cross-tab persistence
let inMemoryProductsCache: Product[] | null = null;

export function getCachedProducts(): Product[] | null {
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return inMemoryProductsCache;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("cozy_studio_products");
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

export function broadcastProductUpdate(product: Product) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("cozy_products_updated", { detail: product }));
  } catch {}
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("cozy_store_channel");
      bc.postMessage({ type: "PRODUCT_UPDATED", product });
      bc.close();
    }
  } catch {}
}

export function saveCachedProducts(products: Product[]) {
  if (!products || products.length === 0) return;
  inMemoryProductsCache = products;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cozy_studio_products", JSON.stringify(products));
      sessionStorage.setItem("cozy_cached_products", JSON.stringify(products));
    } catch {
      // If QuotaExceededError, store a sanitized version where large data URLs are replaced by fallback image
      try {
        const sanitized = products.map((p) => ({
          ...p,
          image: typeof p.image === "string" && p.image.length > 8000 ? "/assets/cloud-throw.jpg" : p.image,
        }));
        localStorage.setItem("cozy_studio_products", JSON.stringify(sanitized));
      } catch {}
    }
  }
}

const OVERRIDES_KEY = "cozy_studio_product_overrides";
const LOCAL_PRODS_KEY = "cozy_studio_local_products";
const DELETED_PRODS_KEY = "cozy_deleted_product_slugs";

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const hasFilter = Boolean((category && category !== "All") || (search && search.trim()));

  const filterList = (list: Product[]) => {
    if (!hasFilter) return list;
    return list.filter((p) => {
      if (category && category.toLowerCase() === "sale") {
        const isSale = Boolean(p.onSale || (p.originalPrice && p.originalPrice > p.price));
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return isSale && matchesSearch;
      }
      const matchesCat = !category || category === "All" || p.category.toLowerCase() === category.toLowerCase();
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  };

  // Read client-side overrides, locally created items, and deleted slugs
  let deletedSlugs = new Set<string>();
  let productOverrides: Record<string, Partial<Product>> = {};
  let localCreated: Product[] = [];
  if (typeof window !== "undefined") {
    try {
      deletedSlugs = new Set(JSON.parse(localStorage.getItem(DELETED_PRODS_KEY) || "[]"));
      productOverrides = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
      localCreated = JSON.parse(localStorage.getItem(LOCAL_PRODS_KEY) || "[]");
    } catch {}
  }

  // Always fetch fresh from API with cache-busting to prevent stale responses
  try {
    const params = new URLSearchParams();
    if (category && category !== "All" && category.toLowerCase() !== "sale") params.append("category", category);
    if (search) params.append("search", search);
    params.append("_t", String(Date.now()));
    const qs = params.toString();
    const url = `${API_BASE}/products?${qs}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const fresh = await res.json();
      if (Array.isArray(fresh) && fresh.length > 0) {
        // Merge fresh server data with any locally added items from memory or localStorage
        const storedLocal = getCachedProducts() || [];
        const seenSlugs = new Set<string>();
        const merged: Product[] = [];

        // 1. Process fresh items from server, applying local overrides and filtering deleted
        for (const raw of fresh) {
          if (!raw.slug || deletedSlugs.has(raw.slug) || seenSlugs.has(raw.slug)) continue;
          seenSlugs.add(raw.slug);
          const override = productOverrides[raw.slug] || {};
          const patched: Product = { ...raw, ...override };
          merged.push(patched);
        }

        // 2. Process locally created items that might not be on the server yet
        for (const raw of [...localCreated, ...storedLocal]) {
          if (!raw.slug || deletedSlugs.has(raw.slug) || seenSlugs.has(raw.slug)) continue;
          seenSlugs.add(raw.slug);
          const override = productOverrides[raw.slug] || {};
          const patched: Product = { ...raw, ...override };
          merged.push(patched);
        }

        if (!hasFilter) {
          saveCachedProducts(merged);
        }
        return filterList(merged);
      }
    }
  } catch {
    // network fallback to cache
  }

  // Fallback to cache / localStorage with overrides applied
  const base = getCachedProducts() || fallbackProducts;
  const resolvedBase = base
    .filter((p) => !deletedSlugs.has(p.slug))
    .map((p) => (productOverrides[p.slug] ? { ...p, ...productOverrides[p.slug] } : p));

  return filterList(resolvedBase);
}

export async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  const cachedList = getCachedProducts() || fallbackProducts;
  const foundInCache = cachedList.find((p) => p.slug === slug);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const freshProd = await res.json();
      if (freshProd && freshProd.slug) {
        // Apply local overrides if any
        let productOverrides: Record<string, Partial<Product>> = {};
        if (typeof window !== "undefined") {
          try {
            productOverrides = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
          } catch {}
        }
        const patched = productOverrides[slug] ? { ...freshProd, ...productOverrides[slug] } : freshProd;

        // Update in cache list
        const updated = [patched, ...cachedList.filter((p) => p.slug !== patched.slug)];
        saveCachedProducts(updated);
        return patched;
      }
    }
  } catch {
    // fallback
  }

  return foundInCache;
}

export async function addProduct(product: Partial<Product>): Promise<Product> {
  let createdProduct: Product | null = null;
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      createdProduct = await res.json();
    }
  } catch {
    // fallback
  }

  const finalProduct: Product = createdProduct || {
    slug: product.slug || (product.name ? product.name.toLowerCase().replace(/\s+/g, "-") : "new-piece"),
    name: product.name || "Untitled Crochet Piece",
    category: product.category || "Blankets",
    price: product.price || 50,
    originalPrice: product.originalPrice,
    onSale: product.onSale,
    image: product.image || "/assets/cloud-throw.jpg",
    description: product.description || "Handmade with soft fibres.",
    stock: product.stock || 10,
    ...(product.badge ? { badge: product.badge } : {}),
  };

  // Persist into LOCAL_PRODS_KEY so it survives page reloads even if Vercel serverless resets
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_PRODS_KEY);
      const list: Product[] = raw ? JSON.parse(raw) : [];
      const nextList = [finalProduct, ...list.filter((p) => p.slug !== finalProduct.slug)];
      localStorage.setItem(LOCAL_PRODS_KEY, JSON.stringify(nextList));

      // Remove from deleted slugs if previously present
      const rawDel = localStorage.getItem(DELETED_PRODS_KEY);
      if (rawDel) {
        const delList: string[] = JSON.parse(rawDel);
        const filteredDel = delList.filter((s) => s !== finalProduct.slug);
        localStorage.setItem(DELETED_PRODS_KEY, JSON.stringify(filteredDel));
      }
    } catch {}
  }

  // Immediately inject into cache so any page navigating to shop/store sees it at 0ms!
  const current = getCachedProducts() || fallbackProducts;
  const updated = [finalProduct, ...current.filter((p) => p.slug !== finalProduct.slug)];
  saveCachedProducts(updated);

  broadcastProductUpdate(finalProduct);

  return finalProduct;
}

export async function updateProductApi(idOrSlug: string, updates: Partial<Product>): Promise<Product | null> {
  let result: Product | null = null;
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(idOrSlug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) result = await res.json();
  } catch {
    // fallback
  }

  // Persist edit in OVERRIDES_KEY and LOCAL_PRODS_KEY so edits never get reverted on Vercel
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      const overrides = raw ? JSON.parse(raw) : {};
      overrides[idOrSlug] = { ...(overrides[idOrSlug] || {}), ...updates };
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));

      const rawLocal = localStorage.getItem(LOCAL_PRODS_KEY);
      if (rawLocal) {
        const localList: Product[] = JSON.parse(rawLocal);
        const updatedLocal = localList.map((p) => (p.slug === idOrSlug ? { ...p, ...updates } : p));
        localStorage.setItem(LOCAL_PRODS_KEY, JSON.stringify(updatedLocal));
      }
    } catch {}
  }

  const current = getCachedProducts() || fallbackProducts;
  const next = current.map((p) => (p.slug === idOrSlug ? { ...p, ...updates, ...(result || {}) } : p));
  saveCachedProducts(next);

  const updatedObj = next.find((p) => p.slug === idOrSlug);
  if (updatedObj) {
    broadcastProductUpdate(updatedObj);
  }

  return result || updatedObj || null;
}

export async function deleteProductApi(idOrSlug: string): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/products/${encodeURIComponent(idOrSlug)}`, { method: "DELETE" });
  } catch {}

  // Blacklist in DELETED_PRODS_KEY and remove from local lists
  if (typeof window !== "undefined") {
    try {
      const rawDel = localStorage.getItem(DELETED_PRODS_KEY);
      const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (!delList.includes(idOrSlug)) {
        delList.push(idOrSlug);
        localStorage.setItem(DELETED_PRODS_KEY, JSON.stringify(delList));
      }

      const rawLocal = localStorage.getItem(LOCAL_PRODS_KEY);
      if (rawLocal) {
        const localList: Product[] = JSON.parse(rawLocal);
        const nextLocal = localList.filter((p) => p.slug !== idOrSlug);
        localStorage.setItem(LOCAL_PRODS_KEY, JSON.stringify(nextLocal));
      }

      const rawOverrides = localStorage.getItem(OVERRIDES_KEY);
      if (rawOverrides) {
        const overrides = JSON.parse(rawOverrides);
        delete overrides[idOrSlug];
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }
    } catch {}
  }

  const current = getCachedProducts() || fallbackProducts;
  const next = current.filter((p) => p.slug !== idOrSlug);
  saveCachedProducts(next);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cozy_products_updated", { detail: { slug: idOrSlug, deleted: true } }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cozy_store_channel");
        bc.postMessage({ type: "PRODUCT_DELETED", slug: idOrSlug });
        bc.close();
      }
    } catch {}
  }

  return true;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/orders`, { signal: controller.signal });
    clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/custom-orders`, { signal: controller.signal });
    clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/inventory`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function fetchAnalytics() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/analytics`, { signal: controller.signal });
    clearTimeout(timeoutId);
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

