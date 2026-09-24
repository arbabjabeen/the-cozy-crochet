import { getStore, saveStore } from "../data/store.js";

// @desc    Get inventory items
// @route   GET /api/inventory
export const getInventory = async (req, res) => {
  try {
    const store = getStore();
    return res.json(store.inventory || []);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch inventory", error: error.message });
  }
};

// @desc    Add or update inventory item
// @route   POST /api/inventory
export const addInventoryItem = async (req, res) => {
  try {
    const { item, type, onHand, level = "Healthy" } = req.body;
    const store = getStore();
    const newItem = {
      _id: `inv-${Date.now()}`,
      item,
      type,
      onHand,
      level,
    };
    store.inventory.push(newItem);
    saveStore();
    return res.status(201).json(newItem);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add inventory item", error: error.message });
  }
};
