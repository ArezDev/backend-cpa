import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  // Langsung definisikan url di root jika tipe datanya mengizinkan
  url: process.env.DATABASE_URL, 
} as any);