import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("ℹ️  MONGO_URI not specified. Operating in Resilient In-Memory / File-backed Store Mode.");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}.`);
    console.log("ℹ️  Falling back to Resilient Store Mode for instant development & testing.");
    isConnected = false;
    return false;
  }
};

export const getIsConnected = () => isConnected;
