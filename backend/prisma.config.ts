// backend/prisma.config.ts
// import "dotenv/config";
// import { defineConfig } from "prisma/config";

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Cargar .env explícitamente desde el directorio actual
config({ path: "./.env" });



export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: 'postgresql',
    url: process.env["DATABASE_URL"] || "file:./dev.db",
  },
});