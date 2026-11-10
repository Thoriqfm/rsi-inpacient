import "dotenv/config";
import { defineConfig } from "prisma/config";

// Active database: Supabase PostgreSQL. Legacy MySQL config: prisma.mysql.config.js.
export default defineConfig({
  schema: "prisma/postgresql/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
