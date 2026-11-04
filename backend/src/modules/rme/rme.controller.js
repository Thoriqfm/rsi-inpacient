import { addRme } from "./rme.service.js";

export async function store(req, res) {
    const rme = await addRme(req.validated);

    res.status(201).json({ data: rme, meta: null });
}
