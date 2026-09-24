import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    badge: { type: String },
    description: { type: String, required: true },
    stock: { type: Number, required: true, default: 10 },
    rating: { type: Number, default: 5 },
    numReviews: { type: Number, default: 12 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
