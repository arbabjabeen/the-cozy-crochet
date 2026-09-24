import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import customOrderRoutes from "./routes/customOrderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database (with fallback)
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Mount API Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "The Cozy Crochet MERN Backend", time: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

app.listen(PORT, () => {
  console.log(`🌸 The Cozy Crochet Backend running at http://localhost:${PORT}`);
  console.log(`✨ API ready at http://localhost:${PORT}/api/products`);
  console.log(`💌 Custom Orders endpoint at http://localhost:${PORT}/api/custom-orders`);
});

export default app;
