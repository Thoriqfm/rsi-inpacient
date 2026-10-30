import "dotenv/config";
import { defineConfig } from "prisma/config";

// Opt-in only: restore PostgreSQL URLs in .env before using this config.
export default defineConfig({
  schema: "prisma/postgresql/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
