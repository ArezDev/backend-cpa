import { NextApiRequest, NextApiResponse } from 'next';
import dayjs, { WIB_TZ } from "@/lib/dayjs";
import { getCurrentWibWindowForDB } from '@/lib/time';
import { prisma } from '@/lib/prisma'; // Sesuaikan path prisma client Anda

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = dayjs().tz(WIB_TZ);
  const todayDate = now.format("YYYY-MM-DD");
  const currentHour = now.format("HH");
  const { startStr, endStr } = getCurrentWibWindowForDB();

  try {
    // 1. Eksekusi query secara parallel untuk performa lebih cepat
    const [leadRows, clickRows, liveClickRows] = await Promise.all([
      prisma.leads.findMany({
        where: {
          created_at: {
            gte: new Date(startStr),
            lt: new Date(endStr),
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.clicks.findMany({
        take: 45,
        orderBy: { created_at: 'desc' },
      }),
      prisma.live_clicks.findMany({
        take: 15,
        orderBy: { created_at: 'desc' },
      })
    ]);

    // 2. Pemrosesan Data Leads (Aggregasi)
    const earningPerUser: Record<string, number> = {};
    const countryCount: Record<string, number> = {};

    const leads = leadRows.map((row) => {
      const earning = Number(row.earning) || 0;
      const country = row.country || 'Unknown';
      const userId = row.userId;

      // Aggregasi
      earningPerUser[userId] = (earningPerUser[userId] || 0) + earning;
      countryCount[country] = (countryCount[country] || 0) + 1;

      return {
        ...row,
        earning,
        created_at: dayjs(row.created_at).tz(WIB_TZ).toDate(),
      };
    });

    // 3. Transformasi Top Data
    const topUsers = Object.entries(earningPerUser)
      .map(([username, total]) => ({ username, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // topLeads dalam kode asli Anda memiliki logika yang sama dengan earningPerUser
    const topLeads = Object.entries(earningPerUser)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topCountry = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Pemrosesan Clicks
    const clicks = clickRows.map((row) => ({
      ...row,
      created_at: dayjs(row.created_at).tz(WIB_TZ),
    }));

    // Filter klik per user pada jam ini (logic dipertahankan)
    const clicksPerUserHour: Record<string, number> = {};
    clicks.forEach((click) => {
      if (click.created_at.format("YYYY-MM-DD") === todayDate && 
          click.created_at.format("HH") === currentHour) {
        clicksPerUserHour[click.user] = (clicksPerUserHour[click.user] || 0) + 1;
      }
    });

    // 5. Pemrosesan Live Clicks
    const liveClicks = liveClickRows.map((row) => ({
      ...row,
      created_at: dayjs(row.created_at).tz(WIB_TZ).toDate(),
    }));

    return res.status(200).json({
      topUsers,
      topLeads,
      leads,
      clicks: clicks.map(c => ({...c, created_at: c.created_at.toDate()})), // Convert back to Date for JSON
      liveClicks,
      countryData: countryCount,
      topCountry,
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}