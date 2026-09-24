import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/server/db";

export async function GET() {
  try {
    const stats = await getAnalytics();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to calculate analytics", error: err.message }, { status: 500 });
  }
}
