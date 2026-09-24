import { NextRequest, NextResponse } from "next/server";
import { getProducts, getUsers, createProduct } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const vendorProducts = await getProducts({ vendorId });
    return NextResponse.json(vendorProducts);
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to fetch vendor products", error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, stock, description, image, vendorId } = body;

    if (!name || !price || !vendorId) {
      return NextResponse.json({ message: "Product name, price and vendorId are required" }, { status: 400 });
    }

    const users = await getUsers();
    const vendor = users.find((u) => u._id === vendorId && u.role === "vendor");

    if (!vendor) {
      return NextResponse.json({ message: "Vendor account not found" }, { status: 404 });
    }

    if (vendor.status !== "approved") {
      return NextResponse.json({ message: "Your vendor account is pending approval." }, { status: 403 });
    }

    const newProduct = await createProduct({
      name: name.trim(),
      category: category || "Artisan Creations",
      price: Math.max(1, Number(price)),
      stock: Math.max(1, Number(stock) || 5),
      description: description?.trim() || "Handcrafted with premium yarn.",
      image: image || "/assets/cloud-throw.jpg",
      badge: "Artisan Vendor",
      vendorId: vendor._id,
      vendorName: vendor.shopName || vendor.name,
    });

    return NextResponse.json(
      { message: "Product listed successfully!", product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to add vendor product", error: error.message }, { status: 500 });
  }
}
