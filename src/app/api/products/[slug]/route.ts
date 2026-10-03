import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, updateProduct, deleteProduct } from "@/lib/server/db";
import { fetchFromCloudBin, saveToCloudBin } from "../../cloud-sync/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const [product, cloudData] = await Promise.all([
    getProductBySlug(slug),
    fetchFromCloudBin().catch(() => null),
  ]);

  const deletedSlugs = new Set(cloudData?.deletedSlugs || []);
  if (deletedSlugs.has(slug)) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const overrides = cloudData?.overrides?.[slug] || {};
  const localProd = (cloudData?.localProducts || []).find((p: any) => p.slug === slug);

  const finalProduct = localProd
    ? { ...localProd, ...overrides }
    : product
    ? { ...product, ...overrides }
    : null;

  if (!finalProduct) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json(finalProduct, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json();
  const product = await updateProduct(slug, body);

  // Instantly persist to cloud bin so changes are live across all devices
  try {
    const cloud = (await fetchFromCloudBin()) || {};
    const overrides = { ...(cloud.overrides || {}) };
    overrides[slug] = { ...(overrides[slug] || {}), ...body };
    const updatedCloud = {
      ...cloud,
      updatedAt: Date.now(),
      overrides,
    };
    await saveToCloudBin(updatedCloud);
  } catch {}

  return NextResponse.json(product || { slug, ...body });
}

export { PATCH as PUT };

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await deleteProduct(slug);

  // Instantly persist deletion to cloud bin so product vanishes everywhere
  try {
    const cloud = (await fetchFromCloudBin()) || {};
    const deletedSlugs = Array.from(new Set([...(cloud.deletedSlugs || []), slug]));
    const overrides = { ...(cloud.overrides || {}) };
    delete overrides[slug];
    const localProducts = (cloud.localProducts || []).filter((p: any) => p.slug !== slug);
    const updatedCloud = {
      ...cloud,
      updatedAt: Date.now(),
      deletedSlugs,
      overrides,
      localProducts,
    };
    await saveToCloudBin(updatedCloud);
  } catch {}

  return NextResponse.json({ message: "Product deleted" });
}

