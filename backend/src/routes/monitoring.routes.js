import { Router } from "express";
import { index } from "../modules/monitoring/monitoring.controller.js";
import { monitoringQuerySchema } from "../modules/monitoring/monitoring.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// Pemantauan status penanganan pasien adalah wewenang Petugas Administrasi (UC-06).
const monitoringRole = requireRole(ROLES.ADMINISTRASI);

router.use(authenticateToken);

// Hanya GET: tidak ada endpoint yang mengubah status antrean atau rujukan dari sini.
router.get("/", monitoringRole, validateQuery(monitoringQuerySchema), index);

export default router;
