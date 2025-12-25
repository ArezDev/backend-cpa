import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

const createPrismaClient = () => {
  // Only use the adapter if you actually need the custom driver features
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma