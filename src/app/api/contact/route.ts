import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, deleteMessages } from "@/lib/server/db";
import { sendAdminContactNotification } from "@/lib/server/email";
import { appendMessageToCloud, fetchFromCloudBin, saveToCloudBin } from "../cloud-sync/route";

export const dynamic = "force-dynamic";

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

    // Ensure message is immediately persisted in Cloud Sync bin across all devices
    try {
      await appendMessageToCloud(newMessage);
    } catch {}

    sendAdminContactNotification({ name, phone: contactPhone, email, message }).catch((e) =>
      console.warn("Contact notification email error:", e)
    );

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to save message", error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dbMessages = await getMessages().catch(() => []);
    const cloud = await fetchFromCloudBin().catch(() => null);
    const cloudMessages = cloud && Array.isArray(cloud.messages) ? cloud.messages : [];
    const deletedSet = new Set(cloud && Array.isArray(cloud.deletedMsgIds) ? cloud.deletedMsgIds : []);

    const deletedSigs: string[] = cloud && Array.isArray(cloud.deletedMsgSigs) ? cloud.deletedMsgSigs : [];
    const isDeletedSig = (m: any) => {
      for (const sig of deletedSigs) {
        if (sig && (m.message?.trim() === sig || `${m.name || ""}::${m.message?.trim()}` === sig)) {
          return true;
        }
      }
      return false;
    };

    const map = new Map<string, any>();
    [...cloudMessages, ...dbMessages].forEach((m: any) => {
      const k = m && (m._id || m.id);
      if (
        k &&
        !deletedSet.has(k) &&
        !deletedSet.has(m.id) &&
        !deletedSet.has(m._id) &&
        !k.startsWith("msg-demo") &&
        !isDeletedSig(m)
      ) {
        map.set(k, m);
      }
    });

    const all = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json(all, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch messages", error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await deleteMessages(id || undefined);

    if (id) {
      try {
        const cloud = (await fetchFromCloudBin()) || {};
        const existingDeleted: string[] = Array.isArray(cloud.deletedMsgIds) ? cloud.deletedMsgIds : [];
        const updatedDeleted = Array.from(new Set([...existingDeleted, id]));
        const remainingMessages = (cloud.messages || []).filter(
          (m: any) => m && m._id !== id && m.id !== id
        );
        const merged = {
          ...cloud,
          updatedAt: Date.now(),
          deletedMsgIds: updatedDeleted,
          messages: remainingMessages,
        };
        await saveToCloudBin(merged);
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to delete message", error: err.message }, { status: 500 });
  }
}
