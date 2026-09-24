import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    paymentMethod: { type: String, default: "Card" },
    subtotal: { type: Number, required: true },
    giftWrap: { type: Boolean, default: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Paid", "Packing", "Shipped", "Delivered", "Cancelled"],
      default: "Paid",
    },
    isPaid: { type: Boolean, default: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
