// Manual CLI entrypoint for running the idempotent SIMRS bootstrap seeder:
//   npm run seed  (or: node prisma/seed-all.js)
import "dotenv/config";
import prisma from "../src/config/prisma.js";
import { runBootstrapSeed } from "../src/config/seed-bootstrap.js";

await runBootstrapSeed();
await prisma.$disconnect();

