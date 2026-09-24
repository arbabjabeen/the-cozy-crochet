export const sendCustomOrderNotification = async (orderData) => {
  const {
    customOrderId,
    customerName,
    customerEmail,
    customerPhone,
    productType,
    colorPreference,
    sizeDimensions,
    designStyle,
    quantity,
    instructions,
    estimatedBudget,
    targetDate,
    referenceImage,
  } = orderData;

  // 1. Prepare human-readable summary
  const summary = `
🧶 NEW CUSTOM CROCHET ORDER RECEIVED! 🧶
---------------------------------------------
Order ID: ${customOrderId}
Customer: ${customerName}
Email: ${customerEmail}
Phone/WhatsApp: ${customerPhone}

Product Type: ${productType}
Color Preference: ${colorPreference}
Size / Dimensions: ${sizeDimensions}
Design / Pattern: ${designStyle}
Quantity: ${quantity}
Estimated Budget: ${estimatedBudget || "Flexible / Not specified"}
Required Date: ${targetDate || "No urgent deadline"}
Reference Photo: ${referenceImage ? "Photo Attached" : "None provided"}

Additional Instructions:
${instructions || "No special instructions"}
---------------------------------------------
`;

  console.log("\n==========================================");
  console.log("📨 NOTIFICATION DISPATCH (MAKER INBOX):");
  console.log(summary);
  console.log("==========================================\n");

  // 2. Generate WhatsApp Web URL so the customer or system can one-click send details to maker
  const whatsappMessage = encodeURIComponent(
    `Hello The Cozy Crochet! 🌸\nI just submitted a Custom Order request (${customOrderId}):\n\n` +
      `• Item: ${productType} (Qty: ${quantity})\n` +
      `• Color: ${colorPreference}\n` +
      `• Size: ${sizeDimensions}\n` +
      `• Pattern: ${designStyle}\n` +
      `• Name: ${customerName}\n` +
      `• Phone: ${customerPhone}\n\n` +
      `Looking forward to hearing from you!`
  );

  const makerWhatsAppNumber = process.env.MAKER_WHATSAPP || "";
  const whatsappUrl = makerWhatsAppNumber
    ? `https://wa.me/${makerWhatsAppNumber}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  return {
    success: true,
    customOrderId,
    whatsappUrl,
    message: "Notification generated and recorded successfully.",
  };
};
