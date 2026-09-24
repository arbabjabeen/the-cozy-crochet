import { Order } from "../models/Order.js";
import { getIsConnected } from "../config/db.js";
import { getStore, saveStore } from "../data/store.js";

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      shippingAddress,
      paymentMethod = "Card",
      subtotal,
      giftWrap = true,
      total,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const orderNumber = `#CC-${Math.floor(2000 + Math.random() * 9000)}`;

    const orderData = {
      orderNumber,
      customer: {
        name: customer?.name || shippingAddress?.fullName || "Guest Customer",
        email: customer?.email || "customer@example.com",
        phone: customer?.phone || "",
      },
      items,
      shippingAddress: {
        fullName: shippingAddress?.fullName || "Valued Customer",
        street: shippingAddress?.street || "Street",
        city: shippingAddress?.city || "City",
        postalCode: shippingAddress?.postalCode || "00000",
      },
      paymentMethod,
      subtotal: Number(subtotal) || 0,
      giftWrap: Boolean(giftWrap),
      total: Number(total) || 0,
      status: "Paid",
      isPaid: true,
      paidAt: new Date(),
    };

    if (getIsConnected()) {
      const order = new Order(orderData);
      const createdOrder = await order.save();
      return res.status(201).json(createdOrder);
    }

    const store = getStore();
    const createdOrder = {
      _id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: new Date().toISOString(),
    };
    store.orders.unshift(createdOrder);
    saveStore();
    return res.status(201).json(createdOrder);
  } catch (error) {
    return res.status(500).json({ message: "Order creation failed", error: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  try {
    if (getIsConnected()) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json(orders);
    }

    const store = getStore();
    return res.json(store.orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (getIsConnected()) {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      order.status = status;
      const updated = await order.save();
      return res.json(updated);
    }

    const store = getStore();
    const order = store.orders.find((o) => o._id === id || o.orderNumber === id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status;
    saveStore();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};
