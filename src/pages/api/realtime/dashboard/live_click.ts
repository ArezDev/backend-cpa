import { NextApiRequest, NextApiResponse } from 'next';
import dayjs, { WIB_TZ } from "@/lib/dayjs";
import { prisma } from '@/lib/prisma'; // Pastikan path sesuai dengan setup Anda

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = dayjs().tz(WIB_TZ);
  const todayDate = now.format("YYYY-MM-DD");
  const currentHour = now.format("HH");

  try {
    // 1. Eksekusi query secara parallel untuk performa maksimal
    const [liveClickRows, clickRows] = await Promise.all([
      // Query Live Clicks (1 menit terakhir)
      prisma.live_clicks.findMany({
        where: {
          created_at: {
            gte: dayjs().subtract(1, 'minute').toDate(),
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      // Query 45 Clicks terakhir
      prisma.clicks.findMany({
        take: 45,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // 2. Mapping data Live Clicks
    const liveClicks = liveClickRows.map((row) => ({
      ...row,
      created_at: dayjs(row.created_at).tz(WIB_TZ).toDate(),
    }));

    // 3. Mapping data Clicks & Logika Hitung per Jam
    const clicksPerUserHour: Record<string, number> = {};
    
    const clicks = clickRows.map((row) => {
      const clickTime = dayjs(row.created_at).tz(WIB_TZ);
      const clickDate = clickTime.format("YYYY-MM-DD");
      const clickHour = clickTime.format("HH");

      // Logic hitung klik per user di jam & hari yang sama
      if (clickDate === todayDate && clickHour === currentHour) {
        clicksPerUserHour[row.user] = (clicksPerUserHour[row.user] || 0) + 1;
      }

      return {
        ...row,
        created_at: clickTime.toDate(),
      };
    });

    return res.status(200).json({ 
      liveClicks, 
      clicks,
      clicksPerUserHour // Data tambahan jika Anda membutuhkannya di frontend
    });

  } catch (err) {
    console.error("Database Error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}