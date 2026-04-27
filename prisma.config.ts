/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrations: {
    seed: 'npx ts-node --skip-project prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL || "",
  },
});
