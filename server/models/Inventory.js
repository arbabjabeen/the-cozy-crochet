import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    type: { type: String, required: true },
    onHand: { type: String, required: true },
    level: {
      type: String,
      enum: ["Healthy", "Low", "Critical"],
      default: "Healthy",
    },
  },
  { timestamps: true }
);

export const Inventory =
  mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
