import { addBed, editBed, getBed, listAvailableBeds, listBeds, removeBed } from "./bed.service.js";
import { parseId } from "../../shared/utils/parse-id.js";

export async function index(req, res) {
    const result = await listBeds(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function available(req, res) {
    const items = await listAvailableBeds();

    res.status(200).json({ data: { items }, meta: null });
}

export async function show(req, res) {
    const bed = await getBed(parseId(req.params.id));

    res.status(200).json({ data: bed, meta: null });
}

export async function store(req, res) {
    const bed = await addBed(req.validated);

    res.status(201).json({ data: bed, meta: null });
}

export async function update(req, res) {
    const bed = await editBed(parseId(req.params.id), req.validated);

    res.status(200).json({ data: bed, meta: null });
}

export async function destroy(req, res) {
    const result = await removeBed(parseId(req.params.id));

    res.status(200).json({ data: result, meta: null });
}
