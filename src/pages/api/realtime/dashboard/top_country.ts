import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getCurrentWibWindowForDB } from '@/lib/time';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = getCurrentWibWindowForDB();
  
  // Konversi string ke Date Object untuk Prisma
  const dateFilter = {
    gte: new Date(start),
    lt: new Date(end),
  };

  try {
    // 1. Eksekusi aggregasi secara parallel
    const [leadsGrouped, clicksGrouped] = await Promise.all([
      // Menghitung leads per negara
      prisma.leads.groupBy({
        by: ['country'],
        where: { created_at: dateFilter },
        _count: { id: true },
      }),
      // Menghitung clicks per negara
      prisma.clicks.groupBy({
        by: ['country'],
        where: { created_at: dateFilter },
        _count: { id: true },
      }),
    ]);

    // 2. Mapping Clicks ke Map untuk lookup O(1)
    const clickMap = new Map(
      clicksGrouped.map((c) => [c.country, c._count.id])
    );

    // 3. Gabungkan data dan hitung CR (Conversion Rate)
    const data = leadsGrouped
      .map((l) => {
        const countryName = l.country || 'Unknown';
        const totalLeads = l._count.id;
        const totalClicks = clickMap.get(l.country) || 0;
        
        // Hitung CR (Conversion Rate)
        const cr = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

        return {
          countryName,
          totalLeads,
          totalClicks,
          cr: parseFloat(cr.toFixed(2)),
        };
      })
      // 4. Urutkan berdasarkan Leads terbanyak
      .sort((a, b) => b.totalLeads - a.totalLeads);

    return res.status(200).json({ data });

  } catch (err) {
    console.error("Country Stats Error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}