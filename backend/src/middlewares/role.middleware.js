import { HttpError } from "../shared/errors/http-error.js";
import { ROLES, ROLE_LIST } from "../shared/constants/roles.js";

export function requireRole(...roles) {
    // Fail at route definition time, not per request.
    if (roles.length === 0 || roles.some((role) => !ROLE_LIST.includes(role))) {
        throw new Error(`requireRole menerima role tidak dikenal: ${roles.join(", ")}`);
    }

    return (req, res, next) => {
        if (!req.user) {
            return next(new HttpError(401, "UNAUTHENTICATED", "Token autentikasi tidak ditemukan."));
        }

        // Super Admin lolos semua cek role.
        if (req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return next(new HttpError(403, "FORBIDDEN", "Anda tidak memiliki hak akses."));
        }

        next();
    };
}
