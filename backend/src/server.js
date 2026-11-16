import "dotenv/config";
import app from "./app.js";
import { runBootstrapSeed } from "./config/seed-bootstrap.js";

const PORT = process.env.PORT || 3001;
const SHOULD_BOOTSTRAP_SEED =
    process.env.ENABLE_BOOTSTRAP_SEED === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.DISABLE_BOOTSTRAP_SEED !== "true");

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at ${PORT}`);
    if (SHOULD_BOOTSTRAP_SEED) {
        runBootstrapSeed();
    }
});
