import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite", // D1 is based on SQLite
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "d1-http",
});