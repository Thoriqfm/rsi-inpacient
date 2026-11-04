import { listMonitoring } from "./monitoring.service.js";

// Monitoring read-only: tidak ada handler tulis di modul ini.
export async function index(req, res) {
    const result = await listMonitoring(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}
