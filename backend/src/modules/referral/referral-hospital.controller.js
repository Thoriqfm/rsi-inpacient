import { listHospitals, setHospitalAvailability } from "./referral-hospital.service.js";
import { parseId } from "../../shared/utils/parse-id.js";

export async function index(req, res) {
    const result = await listHospitals(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function updateAvailability(req, res) {
    const hospital = await setHospitalAvailability(
        parseId(req.params.id),
        req.validated.status_ketersediaan,
        req.user.id_akun,
    );

    res.status(200).json({ data: hospital, meta: null });
}
