import { Router } from "express";
import authRoutes from "./auth.routes.js";
import bedRoutes from "./bed.routes.js";
import allocationRoutes from "./allocation.routes.js";
import queueRoutes from "./queue.routes.js";
import referralRoutes from "./referral.routes.js";
import referralHospitalRoutes from "./referral-hospital.routes.js";
import monitoringRoutes from "./monitoring.routes.js";
import historyRoutes from "./history.routes.js";
import rmeRoutes from "./rme.routes.js";
import billingRoutes from "./billing.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/beds", bedRoutes);
router.use("/allocations", allocationRoutes);
router.use("/queues", queueRoutes);
router.use("/referrals", referralRoutes);
router.use("/referral-hospitals", referralHospitalRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/histories", historyRoutes);
router.use("/rme", rmeRoutes);
router.use("/billing", billingRoutes);

export default router;
