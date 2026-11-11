import "dotenv/config";
import app from "./app.js";
import { runBootstrapSeed } from "./config/seed-bootstrap.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at ${PORT}`);
    runBootstrapSeed();
});
