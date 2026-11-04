import { Router } from "express";
import authRoutes from "./auth.routes.js";
import bedRoutes from "./bed.routes.js";
import allocationRoutes from "./allocation.routes.js";
import queueRoutes from "./queue.routes.js";
import referralRoutes from "./referral.routes.js";
import referralHospitalRoutes from "./referral-hospital.routes.js";
import monitoringRoutes from "./monitoring.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/beds", bedRoutes);
router.use("/allocations", allocationRoutes);
router.use("/queues", queueRoutes);
router.use("/referrals", referralRoutes);
router.use("/referral-hospitals", referralHospitalRoutes);
router.use("/monitoring", monitoringRoutes);

export default router;
