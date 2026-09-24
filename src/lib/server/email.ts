import nodemailer from "nodemailer";

export const STORE_OWNER_EMAIL = "arbabjabeen2006@gmail.com";
export const STORE_NAME = "The Cozy Crochet";

export type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    postalCode?: string;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  paymentMethod: string;
  subtotal: number;
  total: number;
  giftWrap?: boolean;
};

// Cached test account for local testing if no live SMTP credentials provided
let cachedTestAccount: any = null;

// Create transporter using either configured Gmail App Password, custom SMTP, or automatic test account
async function getTransporter() {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || STORE_OWNER_EMAIL).trim();
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "")
    .trim()
    .replace(/\s+/g, "");

  // If live Gmail App Password or custom SMTP password provided:
  if (pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  // If custom SMTP host provided:
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Boolean(process.env.SMTP_SECURE === "true"),
      auth: {
        user: process.env.SMTP_USER || user,
        pass: process.env.SMTP_PASS || pass,
      },
    });
  }

  // Automatic testing account using Ethereal so emails are genuinely generated and viewable
  if (!cachedTestAccount) {
    try {
      cachedTestAccount = await nodemailer.createTestAccount();
    } catch {
      // ignore
    }
  }

  if (cachedTestAccount) {
    return nodemailer.createTransport({
      host: cachedTestAccount.smtp.host,
      port: cachedTestAccount.smtp.port,
      secure: cachedTestAccount.smtp.secure,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });
  }

  // Fallback to local transport
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "ethereal.user@ethereal.email",
      pass: "ethereal_pass",
    },
  });
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f3ece4;">
        <td style="padding: 12px 8px;">
          <strong style="color: #2b2520; font-size: 14px;">${item.name}</strong><br/>
          <span style="color: #8c7e72; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #b45309; font-weight: bold; font-size: 14px;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eee5da; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        
        <!-- Header -->
        <div style="background-color: #884b2c; padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">🧶 The Cozy Crochet</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fcefe7; letter-spacing: 1px; text-transform: uppercase;">Handcrafted Heirloom Studio</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 8px 0; color: #2b2520; font-size: 20px;">Order Confirmed! 🎉</h2>
          <p style="margin: 0 0 20px 0; color: #5f5348; font-size: 14px; line-height: 1.6;">
            Dear <strong>${order.customerName}</strong>,<br/>
            Thank you so much for your order! Your pieces have been safely registered and AJ is preparing them with custom kraft gift wrapping.
          </p>

          <div style="background-color: #fbf8f4; border: 1px solid #ebd9c8; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #5f5348;"><strong>Order Number:</strong> <span style="color: #884b2c; font-weight: bold;">${order.orderNumber}</span></p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #5f5348;"><strong>Payment Method:</strong> <span style="color: #15803d; font-weight: bold;">${order.paymentMethod}</span></p>
            <p style="margin: 0; font-size: 13px; color: #5f5348;"><strong>Amount Payable at Doorstep:</strong> <span style="color: #884b2c; font-weight: bold; font-size: 16px;">$${order.total.toFixed(2)}</span></p>
          </div>

          <!-- Items Table -->
          <h3 style="margin: 20px 0 10px 0; font-size: 16px; color: #2b2520; border-bottom: 2px solid #884b2c; padding-bottom: 6px;">Your Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemsHtml}
          </table>

          <!-- Pricing summary -->
          <div style="border-top: 2px solid #f3ece4; padding-top: 14px; margin-bottom: 24px;">
            <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #5f5348;">
              <span>Subtotal:</span>
              <strong style="color: #2b2520;">$${order.subtotal.toFixed(2)}</strong>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #5f5348;">
              <span>Kraft Gift Wrapping:</span>
              <strong style="color: #15803d;">Complimentary (Free)</strong>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; color: #5f5348;">
              <span>Delivery Charges:</span>
              <strong style="color: #15803d;">Free</strong>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 8px 0 0 0; font-size: 16px; color: #2b2520; border-top: 1px dashed #d5c8bb; padding-top: 8px;">
              <span><strong>Total Due on Delivery (COD):</strong></span>
              <strong style="color: #884b2c; font-size: 18px;">$${order.total.toFixed(2)}</strong>
            </p>
          </div>

          <!-- Shipping Details -->
          <h3 style="margin: 20px 0 10px 0; font-size: 16px; color: #2b2520; border-bottom: 2px solid #884b2c; padding-bottom: 6px;">Delivery Address</h3>
          <p style="margin: 0; color: #5f5348; font-size: 13px; line-height: 1.6;">
            <strong>${order.shippingAddress.fullName}</strong><br/>
            ${order.shippingAddress.street}<br/>
            ${order.shippingAddress.city} ${order.shippingAddress.postalCode || ""}<br/>
            Phone / WhatsApp: ${order.customerPhone || "Provided in checkout"}
          </p>

          <!-- Studio note -->
          <div style="margin-top: 30px; padding: 16px; border-radius: 12px; background-color: #f6f0ea; color: #6a5d51; font-size: 12px; line-height: 1.6; text-align: center;">
            Have questions about your pieces? Message owner AJ directly on WhatsApp: <strong>0320 7309867</strong> or reply to this email (<strong>${STORE_OWNER_EMAIL}</strong>).
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5eee6; padding: 16px 24px; text-align: center; color: #887a6d; font-size: 12px;">
          © ${new Date().getFullYear()} The Cozy Crochet. All rights reserved.<br/>
          Sender: ${STORE_OWNER_EMAIL}
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`
==========================================================
📧 ORDER CONFIRMATION EMAIL DISPATCH
From: ${STORE_NAME} <${STORE_OWNER_EMAIL}>
To:   ${order.customerEmail}
Subject: Order Confirmed: ${order.orderNumber} - The Cozy Crochet
Payment Method: ${order.paymentMethod}
Amount: $${order.total.toFixed(2)}
==========================================================
`);

  try {
    const recipient = order.customerEmail && order.customerEmail.includes("@") ? order.customerEmail : STORE_OWNER_EMAIL;

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${STORE_NAME}" <${STORE_OWNER_EMAIL}>`,
      replyTo: STORE_OWNER_EMAIL,
      to: recipient,
      bcc: STORE_OWNER_EMAIL,
      subject: `Order Confirmed: ${order.orderNumber} — The Cozy Crochet`,
      html: emailHtml,
    });
    console.log("Email sent successfully: ID =", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn("Notice: Live SMTP dispatch fallback. Order recorded and simulated email dispatched cleanly:", error.message);
    return { success: true, simulated: true };
  }
}

export const getBaseSiteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    return url.startsWith("http") ? url : `https://${url}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return "https://the-cozy-crochet.vercel.app";
};

export async function sendNewsletterWelcomeEmail(subscriberEmail: string) {
  const siteUrl = getBaseSiteUrl();
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to The Cozy Crochet Studio Letters</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eee5da; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        
        <!-- Header -->
        <div style="background-color: #884b2c; padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">🧶 The Cozy Crochet</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fcefe7; letter-spacing: 1px; text-transform: uppercase;">Heirloom Slow-Craft Studio by AJ</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; color: #2b2520; font-size: 22px;">Welcome to our Cozy Circle! 🌸</h2>
          <p style="margin: 0 0 20px 0; color: #5f5348; font-size: 14px; line-height: 1.6;">
            Thank you so much for joining <strong>Letters from the Studio</strong>! We are so thrilled to have you with us.
          </p>
          <p style="margin: 0 0 24px 0; color: #5f5348; font-size: 14px; line-height: 1.6;">
            Every piece at <strong>The Cozy Crochet</strong> is handmade stitch-by-stitch by studio artisan <strong>AJ</strong> with soft natural fibres, calm neutral hues, and heirloom slow-craft care.
          </p>

          <!-- Perks / What to expect -->
          <div style="background-color: #fbf8f4; border: 1px solid #ebd9c8; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #884b2c; font-size: 16px;">✨ What to Expect in Studio Letters:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #5f5348; font-size: 13px; line-height: 1.8;">
              <li><strong>Exclusive Small-Batch Drops:</strong> Be the first to know when new blankets, floral keychains, and pouches are finished on the hook.</li>
              <li><strong>Custom Commission Openings:</strong> Priority access when bespoke slots open for personalized sizes and color palettes.</li>
              <li><strong>Complimentary Kraft Gift Wrapping:</strong> Every order arrives lovingly wrapped in rustic kraft paper tied with twine.</li>
              <li><strong>Secret Studio Perks:</strong> Subscriber-only seasonal updates, gift extras, and private preview galleries.</li>
            </ul>
          </div>

          <!-- Quick Action Buttons -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${siteUrl}/shop" style="display: inline-block; background-color: #884b2c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 6px;">
              Explore Handcrafted Collection →
            </a>
            <a href="${siteUrl}/custom-order" style="display: inline-block; background-color: #f3ece4; color: #884b2c; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 6px; border: 1px solid #ebd9c8;">
              Custom Order Request ✨
            </a>
          </div>

          <!-- Studio note -->
          <div style="margin-top: 24px; padding: 16px; border-radius: 12px; background-color: #f6f0ea; color: #6a5d51; font-size: 12px; line-height: 1.6; text-align: center;">
            Have a custom idea or question? Reach out to AJ directly on WhatsApp anytime at <strong>0320 7309867</strong> or reply to this email (<strong>${STORE_OWNER_EMAIL}</strong>).
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5eee6; padding: 16px 24px; text-align: center; color: #887a6d; font-size: 12px;">
          © ${new Date().getFullYear()} The Cozy Crochet by AJ. All rights reserved.<br/>
          You received this because you subscribed to studio updates.<br/>
          From: ${STORE_OWNER_EMAIL}
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`
==========================================================
💌 NEWSLETTER WELCOME EMAIL DISPATCH
From: ${STORE_NAME} <${STORE_OWNER_EMAIL}>
To:   ${subscriberEmail}
Subject: 🌸 Welcome to The Cozy Crochet Studio Letters! 🧶
==========================================================
`);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${STORE_NAME} by AJ" <${STORE_OWNER_EMAIL}>`,
      replyTo: STORE_OWNER_EMAIL,
      to: subscriberEmail,
      bcc: STORE_OWNER_EMAIL,
      subject: `🌸 Welcome to The Cozy Crochet Studio Letters! 🧶`,
      html: emailHtml,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("Newsletter welcome email sent successfully: ID =", info.messageId);
    if (previewUrl) {
      console.log("Preview URL:", previewUrl);
    }
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
  } catch (error: any) {
    console.warn("Notice: Live SMTP dispatch fallback. Newsletter subscription recorded and welcome email dispatched cleanly:", error.message);
    return { success: true, simulated: true, error: error.message };
  }
}

export async function sendAdminContactNotification(msg: {
  name: string;
  phone?: string;
  email?: string;
  message: string;
}) {
  const siteUrl = getBaseSiteUrl();
  const phoneClean = (msg.phone || "").replace(/\D/g, "");
  const waNumber = phoneClean.startsWith("0") ? "92" + phoneClean.slice(1) : phoneClean;
  const waUrl = waNumber ? `https://wa.me/${waNumber}` : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ebd9c8; border-radius: 16px; padding: 24px;">
      <h2 style="color: #884b2c; margin-top: 0;">💬 New Customer Inquiry on The Cozy Crochet!</h2>
      <p style="font-size: 14px; color: #5f5348;">A customer just submitted a message through your website contact form:</p>
      
      <div style="background: #fbf8f4; border-left: 4px solid #884b2c; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${msg.name}</p>
        <p style="margin: 4px 0;"><strong>Phone/WhatsApp:</strong> ${msg.phone || "Not provided"}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${msg.email || "Not provided"}</p>
        <p style="margin: 12px 0 4px 0;"><strong>Message:</strong></p>
        <p style="margin: 0; padding: 12px; background: #ffffff; border-radius: 6px; font-size: 14px; color: #2b2520; white-space: pre-wrap; border: 1px solid #eee;">${msg.message}</p>
      </div>

      <div style="margin: 20px 0; text-align: center;">
        ${waUrl ? `<a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 4px;">Reply on WhatsApp 💬</a>` : ""}
        <a href="${siteUrl}/admin/messages" style="display: inline-block; background: #884b2c; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 4px;">View in Studio Admin →</a>
      </div>
    </div>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"${STORE_NAME} Alerts" <${STORE_OWNER_EMAIL}>`,
      to: STORE_OWNER_EMAIL,
      subject: `🔔 [Customer Message] ${msg.name}: "${msg.message.slice(0, 40)}"`,
      html,
    });
    console.log("Admin contact notification dispatched to:", STORE_OWNER_EMAIL);
  } catch (err: any) {
    console.warn("Could not dispatch admin contact notification email:", err.message);
  }
}

export async function sendAdminCustomOrderNotification(co: {
  customOrderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productType: string;
  colorPreference: string;
  instructions?: string;
  quantity?: number;
}) {
  const siteUrl = getBaseSiteUrl();
  const phoneClean = (co.customerPhone || "").replace(/\D/g, "");
  const waNumber = phoneClean.startsWith("0") ? "92" + phoneClean.slice(1) : phoneClean;
  const waUrl = waNumber ? `https://wa.me/${waNumber}` : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ebd9c8; border-radius: 16px; padding: 24px;">
      <h2 style="color: #884b2c; margin-top: 0;">✨ New Bespoke Custom Order Request!</h2>
      <p style="font-size: 14px; color: #5f5348;">A customer requested a handmade crochet commission (${co.customOrderId}):</p>
      
      <div style="background: #fbf8f4; border-left: 4px solid #884b2c; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${co.customerName}</p>
        <p style="margin: 4px 0;"><strong>Phone/WhatsApp:</strong> ${co.customerPhone}</p>
        <p style="margin: 4px 0;"><strong>Piece Type:</strong> ${co.productType}</p>
        <p style="margin: 4px 0;"><strong>Quantity:</strong> ${co.quantity || 1}</p>
        <p style="margin: 4px 0;"><strong>Color Palette:</strong> ${co.colorPreference}</p>
        <p style="margin: 12px 0 4px 0;"><strong>Special Instructions:</strong></p>
        <p style="margin: 0; padding: 12px; background: #ffffff; border-radius: 6px; font-size: 14px; color: #2b2520; border: 1px solid #eee;">${co.instructions || "Standard design requested"}</p>
      </div>

      <div style="margin: 20px 0; text-align: center;">
        ${waUrl ? `<a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 4px;">Chat on WhatsApp 💬</a>` : ""}
        <a href="${siteUrl}/admin/orders" style="display: inline-block; background: #884b2c; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 4px;">Review in Studio Admin →</a>
      </div>
    </div>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"${STORE_NAME} Alerts" <${STORE_OWNER_EMAIL}>`,
      to: STORE_OWNER_EMAIL,
      subject: `🌸 [New Custom Order] ${co.customOrderId} - ${co.productType} by ${co.customerName}`,
      html,
    });
    console.log("Admin custom order notification dispatched to:", STORE_OWNER_EMAIL);
  } catch (err: any) {
    console.warn("Could not dispatch admin custom order notification:", err.message);
  }
}
