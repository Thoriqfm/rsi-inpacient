import {
    closeAllocationById,
    createAllocationForBed,
    getAllocation,
    listAllocations,
} from "./allocation.service.js";
import { parseId } from "../../shared/utils/parse-id.js";

export async function index(req, res) {
    const result = await listAllocations(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function show(req, res) {
    const alokasi = await getAllocation(parseId(req.params.id));

    res.status(200).json({ data: alokasi, meta: null });
}

export async function store(req, res) {
    const alokasi = await createAllocationForBed(req.validated, req.user.id_akun);

    res.status(201).json({ data: alokasi, meta: null });
}

export async function update(req, res) {
    const alokasi = await closeAllocationById(parseId(req.params.id), req.validated.status_alokasi);

    res.status(200).json({ data: alokasi, meta: null });
}
