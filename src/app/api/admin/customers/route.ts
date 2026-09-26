import { NextRequest, NextResponse } from "next/server";
import { deleteCustomerByEmail } from "@/lib/server/db";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ message: "Email parameter is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === "arbabjabeen2006@gmail.com" || cleanEmail === "admin@cozycrochet.com") {
      return NextResponse.json({ message: "Admin account cannot be deleted" }, { status: 403 });
    }

    const deleted = await deleteCustomerByEmail(cleanEmail);
    if (!deleted) {
      return NextResponse.json({ message: "Could not remove customer" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Customer ${cleanEmail} removed successfully` });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Failed to delete customer", error: err.message },
      { status: 500 }
    );
  }
}
