import { NextApiRequest, NextApiResponse } from 'next';
import dayjs, { WIB_TZ } from "@/lib/dayjs";
import { getCurrentWibWindowForDB } from '@/lib/time';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const now = dayjs().tz(WIB_TZ);
    const todayStr = now.format("YYYY-MM-DD");
    const currentHour = now.format("HH");
    
    // Ambil window waktu dan validasi
    const { start, end } = getCurrentWibWindowForDB();
    
    // Fallback jika helper mengembalikan nilai invalid
    const starttDate = start ? new Date(start) : now.startOf('day').toDate();
    const endDate = end ? new Date(end) : now.endOf('day').toDate();

    if (isNaN(starttDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid Date Range provided by helper");
    }

    // 1. Eksekusi query secara parallel
    const [leadRows, clickRows, liveClickRows] = await Promise.all([
      prisma.leads.findMany({
        where: {
          created_at: { gte: starttDate, lt: endDate },
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

    // 2. Aggregasi Leads & Country dalam satu iterasi (O(n))
    const earningPerUser: Record<string, number> = {};
    const countryCount: Record<string, number> = {};
    
    const leads = leadRows.map((row) => {
      const earning = Number(row.earning) || 0;
      const country = row.country || 'Unknown';
      const userId = row.userId;

      earningPerUser[userId] = (earningPerUser[userId] || 0) + earning;
      countryCount[country] = (countryCount[country] || 0) + 1;

      return {
        ...row,
        earning,
        created_at: dayjs(row.created_at).tz(WIB_TZ).toDate(),
      };
    });

    // 3. Fungsi Helper untuk sorting Top Data agar kode lebih bersih
    const getTopData = (obj: Record<string, number>, limit: number, keyName: string) => 
      Object.entries(obj)
        .map(([name, total]) => ({ [keyName]: name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

    const topUsers = getTopData(earningPerUser, 3, 'username');
    const topLeads = getTopData(earningPerUser, 5, 'name');
    const topCountry = getTopData(countryCount, 99, 'country'); // Ambil semua tapi diurutkan

    // 4. Pemrosesan Clicks & Live Clicks
    // Kita filter langsung saat map untuk efisiensi
    const clicksPerUserHour: Record<string, number> = {};
    
    const clicks = clickRows.map((row) => {
      const clickTime = dayjs(row.created_at).tz(WIB_TZ);
      
      // Update aggregasi per jam jika cocok dengan hari ini & jam ini
      if (clickTime.format("YYYY-MM-DD") === todayStr && clickTime.format("HH") === currentHour) {
        clicksPerUserHour[row.user] = (clicksPerUserHour[row.user] || 0) + 1;
      }

      return {
        ...row,
        created_at: clickTime.toDate(),
      };
    });

    const liveClicks = liveClickRows.map((row) => ({
      ...row,
      created_at: dayjs(row.created_at).tz(WIB_TZ).toDate(),
    }));

    return res.status(200).json({
      topUsers,
      topLeads,
      leads,
      clicks,
      liveClicks,
      countryData: countryCount,
      topCountry,
      clicksPerUserHour // Menambahkan data ini jika dibutuhkan di frontend
    });

  } catch (e: unknown) {
    console.error("Dashboard Error:", e instanceof Error ? e.message : 'Error API Dashboard');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? 
      e instanceof Error ? e.message 
      : 'Error API Dashboard' : 
      undefined 
    });
  }
}