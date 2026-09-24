import { NextResponse } from "next/server";
import { clearDemoOrders } from "@/lib/server/db";

export async function POST() {
  try {
    await clearDemoOrders();
    return NextResponse.json({ success: true, message: "Demo orders cleared! Ready for real customers." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to clear demo data", error: err.message },
      { status: 500 }
    );
  }
}
