import { HttpError } from "../shared/errors/http-error.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";

export function authenticateToken(req, res, next) {
    const header = req.get("authorization") ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new HttpError(401, "UNAUTHENTICATED", "Token autentikasi tidak ditemukan."));
    }

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch (err) {
        next(err);
    }
}
