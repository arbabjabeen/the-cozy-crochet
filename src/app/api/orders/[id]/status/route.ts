import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/server/db";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, isPaid } = body;

    const order = await updateOrderStatus(id, status, isPaid);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to update order", error: err.message }, { status: 500 });
  }
}
