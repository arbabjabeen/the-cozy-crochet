import { NextRequest, NextResponse } from "next/server";
import { getProductReviews, addProductReview } from "@/lib/server/db";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const data = await getProductReviews(slug);

  if (!data) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { name, rating, comment } = body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ message: "Please enter your review comment." }, { status: 400 });
    }

    const result = await addProductReview(slug, { name, rating, comment });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to save review", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
