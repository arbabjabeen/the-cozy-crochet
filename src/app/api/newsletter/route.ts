import { NextRequest, NextResponse } from "next/server";
import { getSubscribers, addSubscriber } from "@/lib/server/db";
import { sendNewsletterWelcomeEmail } from "@/lib/server/email";

export async function GET() {
  try {
    const subscribers = await getSubscribers();
    return NextResponse.json(subscribers);
  } catch (err: any) {
    return NextResponse.json({ message: "Failed to fetch subscribers", error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Please provide a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await addSubscriber(cleanEmail);

    const emailResult = await sendNewsletterWelcomeEmail(cleanEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Subscribed! Welcome email sent 💌",
        messageId: emailResult?.messageId,
        previewUrl: emailResult?.previewUrl,
      },
      { status: result.isNew ? 201 : 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: "Failed to subscribe", error: err.message },
      { status: 500 }
    );
  }
}
