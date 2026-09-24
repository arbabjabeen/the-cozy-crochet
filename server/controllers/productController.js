import { Product } from "../models/Product.js";
import { getIsConnected } from "../config/db.js";
import { getStore, saveStore } from "../data/store.js";

// @desc    Fetch all products with search & category filter
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    if (getIsConnected()) {
      const query = {};
      if (category && category !== "All") {
        query.category = category;
      }
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }
      const products = await Product.find(query);
      return res.json(products);
    }

    // Fallback store
    const store = getStore();
    let filtered = [...store.products];
    if (category && category !== "All") {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching products", error: error.message });
  }
};

// @desc    Fetch single product by slug
// @route   GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (getIsConnected()) {
      const product = await Product.findOne({ slug });
      if (!product) return res.status(404).json({ message: "Product not found" });
      return res.json(product);
    }

    const store = getStore();
    const product = store.products.find((p) => p.slug === slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, image, description, stock, badge } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newProductData = {
      name,
      slug,
      category,
      price: Number(price),
      image: image || "/src/assets/cloud-throw.jpg",
      description,
      stock: Number(stock) || 10,
      badge: badge || "",
      rating: 5,
      numReviews: 1,
    };

    if (getIsConnected()) {
      const product = new Product(newProductData);
      const createdProduct = await product.save();
      return res.status(201).json(createdProduct);
    }

    const store = getStore();
    const createdProduct = {
      _id: `prod-${Date.now()}`,
      ...newProductData,
    };
    store.products.unshift(createdProduct);
    saveStore();
    return res.status(201).json(createdProduct);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      await product.deleteOne();
      return res.json({ message: "Product removed" });
    }

    const store = getStore();
    const idx = store.products.findIndex((p) => p._id === id || p.slug === id);
    if (idx === -1) return res.status(404).json({ message: "Product not found" });
    store.products.splice(idx, 1);
    saveStore();
    return res.json({ message: "Product removed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};
