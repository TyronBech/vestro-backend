/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrations: {
    seed: 'npx ts-node --project tsconfig.json prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL || "",
  },
});
