import { Router } from "express";
import { index, show, store, update, reconcileSnapshot } from "../modules/allocation/allocation.controller.js";
import {
    allocationListQuerySchema,
    createAllocationSchema,
    updateAllocationSchema,
    reconcileRoomSnapshotSchema,
} from "../modules/allocation/allocation.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Seluruh lifecycle alokasi terbuka untuk tiga role (lihat plan, konflik §1.5 vs §1.1).
const allocationRole = requireRole(ROLES.ADMINISTRASI, ROLES.BED_MANAGEMENT);

router.use(authenticateToken);

router.get("/", allocationRole, validateQuery(allocationListQuerySchema), index);
router.post("/", allocationRole, validate(createAllocationSchema), store);
router.post("/:id/room-snapshot", requireRole(ROLES.SUPER_ADMIN), validate(reconcileRoomSnapshotSchema), reconcileSnapshot);
router.get("/:id", allocationRole, show);
router.patch("/:id", allocationRole, validate(updateAllocationSchema), update);

export default router;
