import "dotenv/config";
import { defineConfig } from "prisma/config";

// Legacy local MySQL (nonaktif). Run with --config prisma.mysql.config.js.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/mysql/migrations",
  },
});
