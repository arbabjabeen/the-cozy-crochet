import express from "express";
import {
  createCustomOrder,
  getCustomOrders,
  updateCustomOrderStatus,
} from "../controllers/customOrderController.js";

const router = express.Router();

router.route("/").get(getCustomOrders).post(createCustomOrder);
router.route("/:id/status").put(updateCustomOrderStatus);

export default router;
