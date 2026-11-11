import { Router } from "express";
import { index, show, store, update } from "../modules/queue/queue.controller.js";
import { createQueueSchema, queueListQuerySchema, updateQueueSchema } from "../modules/queue/queue.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Pengelolaan daftar tunggu rawat inap adalah wewenang Petugas Administrasi (UC-04).
const queueRole = requireRole(ROLES.ADMINISTRASI);

router.use(authenticateToken);

router.get("/", queueRole, validateQuery(queueListQuerySchema), index);
router.post("/", queueRole, validate(createQueueSchema), store);
router.get("/:id", queueRole, show);
router.patch("/:id", queueRole, validate(updateQueueSchema), update);

export default router;
