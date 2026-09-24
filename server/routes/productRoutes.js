import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);
router.route("/:slug").get(getProductBySlug);
router.route("/:id").delete(deleteProduct);

export default router;
