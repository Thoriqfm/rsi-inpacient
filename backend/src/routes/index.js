import { Router } from "express";
import authRoutes from "./auth.routes.js";
import bedRoutes from "./bed.routes.js";
import allocationRoutes from "./allocation.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/beds", bedRoutes);
router.use("/allocations", allocationRoutes);

export default router;
