import {
    changeReferralStatus,
    getReferral,
    getReferralHistory,
    listReferrals,
    registerReferral,
} from "./referral.service.js";
import { parseId } from "../../shared/utils/parse-id.js";

export async function index(req, res) {
    const result = await listReferrals(req.validatedQuery);

    res.status(200).json({ data: { items: result.items }, meta: result.meta });
}

export async function show(req, res) {
    const referral = await getReferral(parseId(req.params.id));

    res.status(200).json({ data: referral, meta: null });
}

export async function history(req, res) {
    const items = await getReferralHistory(parseId(req.params.id));

    res.status(200).json({ data: { items }, meta: null });
}

export async function store(req, res) {
    const referral = await registerReferral(req.validated, req.user.id_akun);

    res.status(201).json({ data: referral, meta: null });
}

export async function update(req, res) {
    const referral = await changeReferralStatus(
        parseId(req.params.id),
        req.validated.status,
        req.user.id_akun,
    );

    res.status(200).json({ data: referral, meta: null });
}
