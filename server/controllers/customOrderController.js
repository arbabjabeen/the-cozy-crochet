import { CustomOrder } from "../models/CustomOrder.js";
import { getIsConnected } from "../config/db.js";
import { getStore, saveStore } from "../data/store.js";
import { sendCustomOrderNotification } from "../services/notificationService.js";

// @desc    Submit a custom crochet order
// @route   POST /api/custom-orders
export const createCustomOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      productType,
      colorPreference,
      sizeDimensions,
      designStyle,
      quantity = 1,
      referenceImage = "",
      instructions = "",
      estimatedBudget = "",
      targetDate = "",
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !productType) {
      return res.status(400).json({
        message: "Please provide customer name, email, phone number, and product type.",
      });
    }

    const customOrderId = `#CUST-${Math.floor(100 + Math.random() * 900)}`;

    const customOrderData = {
      customOrderId,
      customerName,
      customerEmail,
      customerPhone,
      productType,
      colorPreference: colorPreference || "Custom choice",
      sizeDimensions: sizeDimensions || "Standard",
      designStyle: designStyle || "Makers Choice",
      quantity: Number(quantity) || 1,
      referenceImage,
      instructions,
      estimatedBudget,
      targetDate,
      status: "New",
      createdAt: new Date().toISOString(),
    };

    let savedOrder;

    if (getIsConnected()) {
      const order = new CustomOrder(customOrderData);
      savedOrder = await order.save();
    } else {
      const store = getStore();
      savedOrder = {
        _id: `cust-${Date.now()}`,
        ...customOrderData,
      };
      if (!store.customOrders) store.customOrders = [];
      store.customOrders.unshift(savedOrder);
      saveStore();
    }

    // Trigger maker notification (Email + WhatsApp prefill)
    const notificationResult = await sendCustomOrderNotification(customOrderData);

    return res.status(201).json({
      success: true,
      message: "Your custom order request has been received! We will reach out to you shortly.",
      customOrder: savedOrder,
      whatsappUrl: notificationResult.whatsappUrl,
    });
  } catch (error) {
    console.error("Custom order submission error:", error);
    return res.status(500).json({
      message: "Failed to submit custom order request",
      error: error.message,
    });
  }
};

// @desc    Get all custom orders (Admin)
// @route   GET /api/custom-orders
export const getCustomOrders = async (req, res) => {
  try {
    if (getIsConnected()) {
      const orders = await CustomOrder.find().sort({ createdAt: -1 });
      return res.json(orders);
    }

    const store = getStore();
    return res.json(store.customOrders || []);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch custom orders", error: error.message });
  }
};

// @desc    Update custom order status (Admin)
// @route   PUT /api/custom-orders/:id/status
export const updateCustomOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (getIsConnected()) {
      const order = await CustomOrder.findById(id);
      if (!order) return res.status(404).json({ message: "Custom order not found" });
      order.status = status;
      const updated = await order.save();
      return res.json(updated);
    }

    const store = getStore();
    const order = store.customOrders.find((o) => o._id === id || o.customOrderId === id);
    if (!order) return res.status(404).json({ message: "Custom order not found" });
    order.status = status;
    saveStore();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update custom order", error: error.message });
  }
};
