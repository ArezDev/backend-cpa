import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Jangan masukkan properti 'datasources' di sini untuk Prisma 7
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;