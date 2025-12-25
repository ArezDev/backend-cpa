import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { cpa } = req.query;
    if (!cpa) res.status(404).json({ error: 'missing network...'});

    if (req.method === 'GET') {
        try {
            const smartlink = 
            await prisma.smartlink.findMany({
                where: { network: String(cpa) },
                select: { 
                    url: true,
                    allowed: true
                 },
            });
            if (smartlink.length === 0) {
                return res.status(404).json({ error: 'Network not found' });
            }

            res.status(200).json(smartlink[0]);
        } catch (error : unknown) {
            res.status(500).json({ error: 'Error API', details: error instanceof Error ? error.message : String(error) });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}