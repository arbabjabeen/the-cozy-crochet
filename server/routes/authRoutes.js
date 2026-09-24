import express from "express";
import { registerUser, loginUser, getCustomers } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/customers", getCustomers);

export default router;
