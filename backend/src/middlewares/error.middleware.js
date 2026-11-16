import { HttpError } from "../shared/errors/http-error.js";

const PRISMA_ERROR_MAP = {
    P2002: { status: 409, code: "CONFLICT", message: "Data duplikat atau konflik dengan data yang sudah ada." },
    P2025: { status: 404, code: "NOT_FOUND", message: "Data yang diminta tidak ditemukan." },
    P2003: { status: 422, code: "INVALID_REFERENCE", message: "Referensi data terkait tidak valid atau tidak ditemukan." },
};

export function notFound(req, res) {
    res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: "Endpoint tidak ditemukan.",
            details: [],
        },
    });
}

export function errorHandler(err, req, res, _next) {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Format body JSON tidak valid.",
                details: [],
            },
        });
    }

    const mappedPrisma = typeof err?.code === "string" ? PRISMA_ERROR_MAP[err.code] : null;
    if (mappedPrisma) {
        return res.status(mappedPrisma.status).json({
            error: {
                code: mappedPrisma.code,
                message: mappedPrisma.message,
                details: [],
            },
        });
    }

    const isHttpError = err instanceof HttpError;
    const status = isHttpError ? err.status : 500;

    // Keep internal errors (stack, query, token) out of the response and logs.
    if (!isHttpError) {
        console.error(`[error] ${req.method} ${req.originalUrl}:`, err?.message || err);
    }

    res.status(status).json({
        error: {
            code: isHttpError ? err.code : "INTERNAL_ERROR",
            message: isHttpError ? err.message : "Terjadi kesalahan pada server.",
            details: isHttpError ? err.details : [],
        },
    });
}
