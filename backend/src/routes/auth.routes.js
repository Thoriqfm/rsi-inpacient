import { Router } from "express";
import { login, logout, me, store } from "../modules/auth/auth.controller.js";
import { createAkunSchema, loginSchema } from "../modules/auth/auth.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, me);
router.post(
    "/accounts",
    authenticateToken,
    requireRole(ROLES.SUPER_ADMIN),
    validate(createAkunSchema),
    store,
);

export default router;
