import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Inpatient API is running",
    });
});

export default app;
