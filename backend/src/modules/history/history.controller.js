import { parseId } from "../../shared/utils/parse-id.js";
import {
    getHistoryRecap,
    listHistories,
    listPatientRme,
    registerHistoryRecap,
    removeHistoryRecap,
    searchPatients,
    updateHistoryRecapById,
} from "./history.service.js";

export async function index(req, res) {
    const result = await listHistories(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function show(req, res) {
    const rekap = await getHistoryRecap(parseId(req.params.id));

    res.status(200).json({ data: rekap, meta: null });
}

export async function store(req, res) {
    const rekap = await registerHistoryRecap(req.validated, req.user.id_akun);

    res.status(201).json({ data: rekap, meta: null });
}

export async function update(req, res) {
    const rekap = await updateHistoryRecapById(
        parseId(req.params.id),
        req.validated,
        req.user.id_akun,
    );

    res.status(200).json({ data: rekap, meta: null });
}

export async function destroy(req, res) {
    const result = await removeHistoryRecap(parseId(req.params.id), req.user.id_akun);

    res.status(200).json({ data: result, meta: null });
}

export async function patients(req, res) {
    const items = await searchPatients(req.validatedQuery.q);

    res.status(200).json({ data: { items }, meta: null });
}

export async function rme(req, res) {
    const result = await listPatientRme(req.validatedQuery.id_pasien);

    res.status(200).json({ data: result, meta: null });
}
