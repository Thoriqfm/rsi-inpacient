import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/prisma.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { HttpError } from "./shared/errors/http-error.js";

const app = express();

// Trust reverse proxy headers (Render / Vercel) so req.ip reflects the client IP.
app.set("trust proxy", 1);

// Supports comma-separated origins (e.g. production + custom Vercel domain) without trailing slashes.
const RAW_ORIGINS = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = RAW_ORIGINS.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

if (
    process.env.NODE_ENV === "production" &&
    ALLOWED_ORIGINS.every((origin) => origin.includes("localhost"))
) {
    console.warn(
        "[security] FRONTEND_ORIGIN belum disetel ke domain produksi; request browser dari Vercel akan ditolak CORS.",
    );
}

app.use(helmet());
app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser requests (curl, server-to-server health checks) without Origin header.
            if (!origin) {
                return callback(null, true);
            }
            const normalized = origin.trim().replace(/\/+$/, "");
            if (ALLOWED_ORIGINS.includes(normalized)) {
                return callback(null, true);
            }
            return callback(new HttpError(403, "CORS_FORBIDDEN", "Origin tidak diizinkan oleh CORS."));
        },
        credentials: true,
    }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        data: {
            status: "ok",
            service: "inpatient-api",
        },
        meta: null,
    });
});

app.get("/api/health/ready", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            data: {
                status: "ready",
                database: "connected",
            },
            meta: null,
        });
    } catch {
        res.status(503).json({
            error: {
                code: "DATABASE_UNAVAILABLE",
                message: "Koneksi database sedang tidak tersedia.",
                details: [],
            },
        });
    }
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
