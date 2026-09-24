import { NextRequest, NextResponse } from "next/server";
import { getCustomOrders, createCustomOrder } from "@/lib/server/db";
import { sendNotification } from "@/lib/server/store";

export async function GET() {
  try {
    const orders = await getCustomOrders();
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch custom orders", error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, productType } = body;

    if (!customerName || !customerPhone || !productType) {
      return NextResponse.json(
        { message: "Please provide customer name, phone number, and product type." },
        { status: 400 }
      );
    }

    const newCustomOrder = await createCustomOrder(body);
    const notif = sendNotification(newCustomOrder);

    return NextResponse.json(
      {
        success: true,
        message: "Your custom order request has been received! We will reach out to you shortly.",
        customOrder: newCustomOrder,
        whatsappUrl: notif.whatsappUrl,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: "Failed to submit custom order", error: err.message },
      { status: 500 }
    );
  }
}
