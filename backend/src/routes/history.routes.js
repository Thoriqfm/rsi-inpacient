import { Router } from "express";
import {
    destroy,
    index,
    patients,
    rme,
    show,
    store,
    update,
} from "../modules/history/history.controller.js";
import {
    createHistorySchema,
    historyListQuerySchema,
    patientRmeQuerySchema,
    patientSearchQuerySchema,
    updateHistorySchema,
} from "../modules/history/history.validation.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";

const router = Router();

// DECISION REQUIRED: matriks role UC-07 belum ditetapkan final. Pengelolaan rekap
// dibatasi ke Petugas Administrasi; Super Admin lolos otomatis.
const historyRole = requireRole(ROLES.ADMINISTRASI);

router.use(authenticateToken);

// Harus sebelum /:id agar tidak tertangkap sebagai id rekap.
router.get("/patients", historyRole, validateQuery(patientSearchQuerySchema), patients);
router.get("/rme", historyRole, validateQuery(patientRmeQuerySchema), rme);

router.get("/", historyRole, validateQuery(historyListQuerySchema), index);
router.post("/", historyRole, validate(createHistorySchema), store);
router.get("/:id", historyRole, show);
router.patch("/:id", historyRole, validate(updateHistorySchema), update);
router.delete("/:id", historyRole, destroy);

export default router;
