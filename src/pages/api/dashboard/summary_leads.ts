import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSummaryWIB } from '@/lib/time';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;

  if (typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({ error: 'Missing parameter date!' });
  }

  try {
    const { debug } = getSummaryWIB(start, end);
    const dateFilter = {
      gte: new Date(debug.startDB),
      lt: new Date(debug.endDB),
    };

    // 1. Ambil data aggregasi dari kedua tabel secara paralel
    const [userSummaryAgg, leadsAgg] = await Promise.all([
      // Aggregasi Total Clicks dari user_summary
      prisma.user_summary.groupBy({
        by: ['user'],
        where: { created_at: dateFilter },
        _sum: { total_click: true },
        _max: { id: true },
      }),
      // Aggregasi Total Leads & Earning dari leads
      prisma.leads.groupBy({
        by: ['userId'],
        where: { created_at: dateFilter },
        _count: { id: true },
        _sum: { earning: true },
      }),
    ]);

    // 2. Mapping data Leads ke dalam Map untuk lookup cepat (O(1))
    const leadMap = new Map(
      leadsAgg.map((l) => [
        l.userId,
        {
          total_lead: l._count.id || 0,
          total_earning: Number(l._sum.earning) || 0,
        },
      ])
    );

    // 3. Gabungkan data (Left Join logic di Memory)
    const summary = userSummaryAgg
      .map((us) => {
        const leadData = leadMap.get(us.user) || { total_lead: 0, total_earning: 0 };
        return {
          id: us._max.id,
          user: us.user,
          total_click: us._sum.total_click || 0,
          total_lead: leadData.total_lead,
          total_earning: leadData.total_earning,
        };
      })
      // 4. Urutkan berdasarkan earning tertinggi
      .sort((a, b) => b.total_earning - a.total_earning);

    return res.status(200).json({ summary });
  } catch (err) {
    console.error("Summary API Error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}