import { Router } from "express";
import { history, index, show, store, update } from "../modules/referral/referral.controller.js";
import {
    createReferralSchema,
    referralListQuerySchema,
    updateReferralStatusSchema,
} from "../modules/referral/referral.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

const referralRole = requireRole(ROLES.ADMINISTRASI, ROLES.BED_MANAGEMENT);

router.use(authenticateToken);

router.get("/", referralRole, validateQuery(referralListQuerySchema), index);
router.post("/", referralRole, validate(createReferralSchema), store);
router.get("/:id", referralRole, show);
router.patch("/:id/status", referralRole, validate(updateReferralStatusSchema), update);
router.get("/:id/history", referralRole, history);

export default router;
