import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaMariaDb({
  host: "100.68.36.87",
  port: 3306,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
})

export const prisma = new PrismaClient({ adapter })