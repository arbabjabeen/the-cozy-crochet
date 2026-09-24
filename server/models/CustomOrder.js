import mongoose from "mongoose";

const customOrderSchema = new mongoose.Schema(
  {
    customOrderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    productType: {
      type: String,
      required: true,
      enum: ["Blanket", "Bag", "Amigurumi", "Wearable / Beanie", "Home Decor", "Other"],
    },
    colorPreference: { type: String, required: true },
    sizeDimensions: { type: String, required: true },
    designStyle: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    referenceImage: { type: String }, // Base64 or Image URL
    instructions: { type: String },
    estimatedBudget: { type: String },
    targetDate: { type: String },
    status: {
      type: String,
      enum: ["New", "Under Review", "Quoted", "In Progress", "Completed", "Declined"],
      default: "New",
    },
  },
  { timestamps: true }
);

export const CustomOrder =
  mongoose.models.CustomOrder || mongoose.model("CustomOrder", customOrderSchema);
