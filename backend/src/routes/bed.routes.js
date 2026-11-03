import { Router } from "express";
import { available, destroy, index, show, store, update } from "../modules/bed/bed.controller.js";
import { bedListQuerySchema, createBedSchema, updateBedSchema } from "../modules/bed/bed.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Master bed: Super Admin (auto-lolos) + Petugas Bed Management.
const masterBed = requireRole(ROLES.BED_MANAGEMENT);

router.use(authenticateToken);

// Petugas Administrasi hanya boleh melihat ketersediaan untuk alokasi, bukan master bed.
router.get("/available", requireRole(ROLES.ADMINISTRASI, ROLES.BED_MANAGEMENT), available);

router.get("/", masterBed, validateQuery(bedListQuerySchema), index);
router.post("/", masterBed, validate(createBedSchema), store);
router.get("/:id", masterBed, show);
router.patch("/:id", masterBed, validate(updateBedSchema), update);
router.delete("/:id", masterBed, destroy);

export default router;
