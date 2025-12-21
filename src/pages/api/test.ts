// pages/api/test.ts
import { prisma, redis } from '@/lib/infrastructure';

export default async function handler(req, res) {
  // Logic Anda di sini
  res.status(200).json({ ok: true });
}