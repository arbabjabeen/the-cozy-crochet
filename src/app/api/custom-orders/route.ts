import { NextRequest, NextResponse } from "next/server";
import { getCustomOrders, createCustomOrder } from "@/lib/server/db";
import { sendNotification } from "@/lib/server/store";
import { sendAdminCustomOrderNotification } from "@/lib/server/email";

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

    sendAdminCustomOrderNotification({
      customOrderId: newCustomOrder.customOrderId || newCustomOrder._id,
      customerName: newCustomOrder.customerName,
      customerPhone: newCustomOrder.customerPhone,
      customerEmail: newCustomOrder.customerEmail,
      productType: newCustomOrder.productType,
      colorPreference: newCustomOrder.colorPreference,
      instructions: newCustomOrder.instructions,
      quantity: newCustomOrder.quantity,
    }).catch((e) => console.warn("Admin custom order email notification error:", e));

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
