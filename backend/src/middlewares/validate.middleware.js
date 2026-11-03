import { HttpError } from "../shared/errors/http-error.js";

export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return next(new HttpError(400, "VALIDATION_ERROR", "Input tidak valid.", details));
        }

        req.validated = result.data;
        next();
    };
}

// Query string selalu berupa string; schema yang meng-coerce tipe.
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return next(new HttpError(400, "VALIDATION_ERROR", "Query tidak valid.", details));
        }

        req.validatedQuery = result.data;
        next();
    };
}
