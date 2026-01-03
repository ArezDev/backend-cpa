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
            await prisma.smartlinks.findMany({
                where: { network: String(cpa) },
                select: { 
                    network: true,
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
    } else if (req.method === 'PUT') {
        try {
            const { network, url, allowed } = req.body;
            const editNetwork = await prisma.smartlinks.update({
                where: {
                    id: Number(cpa)
                },
                data: {
                    network,
                    url,
                    allowed
                }
            });
            return res.status(201).json({
                status: true,
                data: editNetwork,
                message: 'Update network sukses!'
            });
        } catch (err : unknown) {
            return res.status(500).json({
                status: false,
                message: err instanceof Error ? err.message : 'Error update networks!'
            });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}