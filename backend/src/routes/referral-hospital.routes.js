import { Router } from "express";
import { index, updateAvailability } from "../modules/referral/referral-hospital.controller.js";
import { hospitalAvailabilitySchema, hospitalListQuerySchema } from "../modules/referral/referral.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Pengelolaan ketersediaan & rujukan RS rujukan adalah wewenang Petugas Administrasi (UC-05).
const referralRole = requireRole(ROLES.ADMINISTRASI);

router.use(authenticateToken);

router.get("/", referralRole, validateQuery(hospitalListQuerySchema), index);
router.patch("/:id/availability", referralRole, validate(hospitalAvailabilitySchema), updateAvailability);

export default router;
