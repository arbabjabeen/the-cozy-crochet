import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, deleteMessages } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, message } = body;
    const contactPhone = phone || email;
    if (!name || !message || !contactPhone) {
      return NextResponse.json(
        { message: "Name, phone/WhatsApp number, and message are required" },
        { status: 400 }
      );
    }

    const newMessage = await addMessage({ name, phone, email, message });
    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to save message", error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch messages", error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await deleteMessages(id || undefined);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to delete message", error: err.message }, { status: 500 });
  }
}
