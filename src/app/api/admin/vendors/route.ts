import { NextRequest, NextResponse } from "next/server";
import { getUsers, updateVendorStatus } from "@/lib/server/db";
import { type VendorStatus } from "@/lib/server/store";

export async function GET() {
  try {
    const users = await getUsers();
    const vendors = users.filter((u) => u.role === "vendor");
    const counts = {
      total: vendors.length,
      pending: vendors.filter((v) => v.status === "pending").length,
      approved: vendors.filter((v) => v.status === "approved").length,
      rejected: vendors.filter((v) => v.status === "rejected").length,
    };
    return NextResponse.json({ vendors, counts });
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to fetch vendors", error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, status } = body as { vendorId: string; status: VendorStatus };

    if (!vendorId || !status) {
      return NextResponse.json({ message: "vendorId and status are required" }, { status: 400 });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const vendor = await updateVendorStatus(vendorId, status);
    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Vendor '${vendor.shopName || vendor.name}' status updated to ${status}!`,
      vendor,
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to update vendor", error: error.message }, { status: 500 });
  }
}
