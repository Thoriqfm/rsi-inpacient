import { HttpError } from "../shared/errors/http-error.js";

export function notFound(req, res) {
    res.status(404).json({
        error: {
            code: "NOT_FOUND",
            message: "Endpoint tidak ditemukan.",
            details: [],
        },
    });
}

export function errorHandler(err, req, res, next) {
    const isHttpError = err instanceof HttpError;
    const status = isHttpError ? err.status : 500;

    // Keep internal errors (stack, query, token) out of the response and logs.
    if (!isHttpError) {
        console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
    }

    res.status(status).json({
        error: {
            code: isHttpError ? err.code : "INTERNAL_ERROR",
            message: isHttpError ? err.message : "Terjadi kesalahan pada server.",
            details: isHttpError ? err.details : [],
        },
    });
}
