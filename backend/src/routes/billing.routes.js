import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { ROLES } from "../shared/constants/roles.js";
import {
    cancel,
    index,
    indexTariffs,
    preview,
    recalculate,
    show,
    store,
    storeTariff,
    updateStatus,
} from "../modules/billing/billing.controller.js";
import {
    billingListQuerySchema,
    cancelBillingSchema,
    createBillingSchema,
    createTariffSchema,
    previewBillingSchema,
    recalculateBillingSchema,
    updateBillingStatusSchema,
} from "../modules/billing/billing.validation.js";

const router = Router();

// DECISION REQUIRED (BILL-D13): matriks role Billing belum ditetapkan final.
// Sementara hanya Petugas Administrasi; Super Admin lolos otomatis.
const billingRole = requireRole(ROLES.ADMINISTRASI);

router.use(authenticateToken);

// Master tarif: Petugas Administrasi boleh membaca; hanya Super Admin yang boleh menulis.
router.get("/tariffs", billingRole, indexTariffs);
router.post("/tariffs", requireRole(ROLES.SUPER_ADMIN), validate(createTariffSchema), storeTariff);

// Harus sebelum /:id agar tidak tertangkap sebagai id tagihan.
router.post("/preview", billingRole, validate(previewBillingSchema), preview);

router.get("/", billingRole, validateQuery(billingListQuerySchema), index);
router.post("/", billingRole, validate(createBillingSchema), store);
router.get("/:id", billingRole, show);
router.patch("/:id/status", billingRole, validate(updateBillingStatusSchema), updateStatus);
router.post("/:id/recalculate", billingRole, validate(recalculateBillingSchema), recalculate);
router.post("/:id/cancel", billingRole, validate(cancelBillingSchema), cancel);

export default router;
