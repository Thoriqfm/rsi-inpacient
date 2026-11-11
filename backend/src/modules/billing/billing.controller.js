import { parseId } from "../../shared/utils/parse-id.js";
import {
    addTariff,
    cancelBilling,
    changeBillingStatus,
    createInvoice,
    getBilling,
    listBillings,
    previewBillingCost,
    recalculateBilling,
} from "./billing.service.js";

export async function index(req, res) {
    const result = await listBillings(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function preview(req, res) {
    const result = await previewBillingCost(req.validated.id_rekap);

    res.status(200).json({ data: result, meta: null });
}

export async function store(req, res) {
    const billing = await createInvoice(req.validated, req.user.id_akun);

    res.status(201).json({ data: billing, meta: null });
}

export async function storeTariff(req, res) {
    const tarif = await addTariff(req.validated);

    res.status(201).json({ data: tarif, meta: null });
}

export async function show(req, res) {
    const billing = await getBilling(parseId(req.params.id));

    res.status(200).json({ data: billing, meta: null });
}

export async function updateStatus(req, res) {
    const billing = await changeBillingStatus(
        parseId(req.params.id),
        req.validated.status,
        req.user.id_akun,
    );

    res.status(200).json({ data: billing, meta: null });
}

export async function recalculate(req, res) {
    const billing = await recalculateBilling(parseId(req.params.id), req.user.id_akun);

    res.status(200).json({ data: billing, meta: null });
}

export async function cancel(req, res) {
    const billing = await cancelBilling(
        parseId(req.params.id),
        req.validated.alasan,
        req.user.id_akun,
    );

    res.status(200).json({ data: billing, meta: null });
}
