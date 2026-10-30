import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Frontend origin follows ARCHITECTURE.md (port 3000) and can be overridden per environment.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(helmet());
app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true,
    }),
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        data: {
            status: "ok",
            service: "inpatient-api",
        },
        meta: null,
    });
});

export default app;
