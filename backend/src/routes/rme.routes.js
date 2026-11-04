import { Router } from "express";
import { store } from "../modules/rme/rme.controller.js";
import { createRmeSchema } from "../modules/rme/rme.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Data RME simulasi adalah sumber Billing, jadi penulisan manual hanya untuk Super Admin.
router.post("/", authenticateToken, requireRole(ROLES.SUPER_ADMIN), validate(createRmeSchema), store);

export default router;
