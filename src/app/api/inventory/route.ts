import { NextRequest, NextResponse } from "next/server";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/server/db";

export async function GET() {
  try {
    const inv = await getInventory();
    return NextResponse.json(inv);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch inventory", error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, type, onHand, level = "Healthy" } = body;
    const newItem = await addInventoryItem({ item, type, onHand, level });
    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to add inventory", error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, id, onHand, level, item, type } = body;
    const targetId = _id || id;
    const invItem = await updateInventoryItem(targetId, { onHand, level, item, type });
    if (!invItem) return NextResponse.json({ message: "Item not found" }, { status: 404 });
    return NextResponse.json(invItem);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to update inventory", error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });
    const deleted = await deleteInventoryItem(id);
    if (!deleted) return NextResponse.json({ message: "Item not found" }, { status: 404 });
    return NextResponse.json({ message: "Supply item removed" });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to delete inventory item", error: err.message }, { status: 500 });
  }
}
