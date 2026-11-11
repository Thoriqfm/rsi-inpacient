import { cancelQueueById, getQueue, listQueues, registerQueue } from "./queue.service.js";
import { parseId } from "../../shared/utils/parse-id.js";

export async function index(req, res) {
    const result = await listQueues(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function show(req, res) {
    const antrean = await getQueue(parseId(req.params.id));

    res.status(200).json({ data: antrean, meta: null });
}

export async function store(req, res) {
    const antrean = await registerQueue(req.validated, req.user.id_akun);

    res.status(201).json({ data: antrean, meta: null });
}

export async function update(req, res) {
    const antrean = await cancelQueueById(parseId(req.params.id), req.user.id_akun);

    res.status(200).json({ data: antrean, meta: null });
}
