import express from "express";
import { getInventory, addInventoryItem } from "../controllers/inventoryController.js";

const router = express.Router();

router.route("/").get(getInventory).post(addInventoryItem);

export default router;
