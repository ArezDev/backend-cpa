// pages/api/data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis'; // Asumsi singleton redis sudah ada

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Koneksi terbuka secara otomatis di sini (On Demand)
    const data = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Database Connection Error' });
  }
  // Koneksi tidak diputus manual, tapi dikembalikan ke pool untuk digunakan request berikutnya
}