import { PrismaClient } from '../generated/prisma/client';
import { PrismaMysql } from '@prisma/adapter-mysql';
import mysql from 'mysql2/promise';

// Koneksi Pool MySQL menggunakan IP Tailscale
const connectionString = process.env.DATABASE_URL;
const pool = mysql.createPool(connectionString);

// Gunakan Adapter MySQL
const adapter = new PrismaMysql(pool);

export const prisma = new PrismaClient({ adapter });