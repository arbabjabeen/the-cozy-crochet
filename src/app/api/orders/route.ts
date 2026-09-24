import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/server/db";
import { sendOrderConfirmationEmail } from "@/lib/server/email";

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "No items in order" }, { status: 400 });
    }

    const newOrder = await createOrder(body);

    sendOrderConfirmationEmail({
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customer.name,
      customerEmail: newOrder.customer.email,
      customerPhone: newOrder.customer.phone,
      shippingAddress: newOrder.shippingAddress,
      items: newOrder.items,
      paymentMethod: newOrder.paymentMethod,
      subtotal: newOrder.subtotal,
      total: newOrder.total,
      giftWrap: newOrder.giftWrap,
    }).catch((err) => console.error("Email dispatch notification error:", err));

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to create order", error: err.message }, { status: 500 });
  }
}
