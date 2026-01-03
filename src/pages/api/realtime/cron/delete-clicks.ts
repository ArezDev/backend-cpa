import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 1. Definisikan ambang waktu (Threshold)
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Jalankan penghapusan secara paralel untuk efisiensi
    const [liveClicksResult, clicksResult] = await prisma.$transaction([
      prisma.live_clicks.deleteMany({
        where: {
          created_at: {
            lt: oneMinuteAgo,
          },
        },
      }),
      prisma.clicks.deleteMany({
        where: {
          created_at: {
            lt: oneDayAgo,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      deleted: {
        live_clicks: liveClicksResult.count,
        clicks: clicksResult.count
      }
    });
  } catch (e:unknown) {
    console.error('Error deleting old clicks:', e);
    res.status(500).json({ error: 'Internal server error', message: e instanceof Error ? e.message : 'Error server!' });
  } finally {
    // Opsional: Jika ini script mandiri, pastikan disconnect. 
    // Di Next.js API Routes biasanya prisma di-reuse.
    await prisma.$disconnect();
  }
}