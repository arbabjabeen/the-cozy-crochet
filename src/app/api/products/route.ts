import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/server/db";
import { fetchFromCloudBin, saveToCloudBin } from "../cloud-sync/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const [baseProducts, cloudData] = await Promise.all([
      getProducts({ category, search }),
      fetchFromCloudBin().catch(() => null),
    ]);

    const overrides = cloudData?.overrides || {};
    const deletedSlugs = new Set(cloudData?.deletedSlugs || []);
    const localProducts = Array.isArray(cloudData?.localProducts) ? cloudData.localProducts : [];

    const map = new Map<string, any>();

    // 1. Process base products from DB/fallback
    baseProducts.forEach((p: any) => {
      if (p?.slug && !deletedSlugs.has(p.slug)) {
        const ov = overrides[p.slug] || {};
        const merged = { ...p, ...ov };
        if (ov.onSale === false || merged.onSale === false) {
          merged.onSale = false;
          delete merged.originalPrice;
          if (merged.badge?.toLowerCase().trim() === "sale") {
            merged.badge = "";
          }
        }
        map.set(p.slug, merged);
      }
    });

    // 2. Process locally added products from cloud bin
    localProducts.forEach((p: any) => {
      if (p?.slug && !deletedSlugs.has(p.slug)) {
        const ov = overrides[p.slug] || {};
        const existing = map.get(p.slug) || {};
        const merged = { ...existing, ...p, ...ov };
        if (ov.onSale === false || p.onSale === false || merged.onSale === false) {
          merged.onSale = false;
          delete merged.originalPrice;
          if (merged.badge?.toLowerCase().trim() === "sale") {
            merged.badge = "";
          }
        }
        map.set(p.slug, merged);
      }
    });

    let list = Array.from(map.values());

    if (category && category !== "All") {
      if (category.toLowerCase() === "sale") {
        list = list.filter((p) => Boolean(p.onSale));
      } else {
        list = list.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
      }
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    return NextResponse.json(list, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch products", error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newProduct = await createProduct(body);

    // Instantly persist to cloud bin so changes are permanent across all devices
    try {
      const cloud = (await fetchFromCloudBin()) || {};
      const prodMap = new Map<string, any>();
      (cloud.localProducts || []).forEach((p: any) => p?.slug && prodMap.set(p.slug, p));
      prodMap.set(newProduct.slug, newProduct);
      const updatedCloud = {
        ...cloud,
        updatedAt: Date.now(),
        localProducts: Array.from(prodMap.values()),
      };
      await saveToCloudBin(updatedCloud);
    } catch {}

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to create product", error: err.message }, { status: 500 });
  }
}

