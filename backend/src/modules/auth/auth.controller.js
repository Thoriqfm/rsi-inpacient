import { authenticate, createAkun, getCurrentUser, revokeAccessToken } from "./auth.service.js";

export async function login(req, res) {
    const { username, password } = req.validated;
    const result = await authenticate(username, password);

    res.status(200).json({ data: result, meta: null });
}

export async function store(req, res) {
    const akun = await createAkun(req.validated);

    res.status(201).json({ data: akun, meta: null });
}

export async function me(req, res) {
    const user = await getCurrentUser(req.user.id_akun);

    res.status(200).json({ data: user, meta: null });
}

export function logout(req, res) {
    const header = req.get("authorization") ?? "";
    const [, token] = header.split(" ");
    revokeAccessToken(token);
    res.status(200).json({ data: { message: "Logout berhasil." }, meta: null });
}
