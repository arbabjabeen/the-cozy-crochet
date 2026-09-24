import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, updateProduct, deleteProduct } from "@/lib/server/db";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json();
  const product = await updateProduct(slug, body);
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export { PATCH as PUT };

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const deleted = await deleteProduct(slug);
  if (!deleted) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json({ message: "Product deleted" });
}
