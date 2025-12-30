import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type ResponseData = {
    data?: { 
        id: number; 
        network: string; 
        url: string; 
        allowed: string | null; 
    }[];
    error?: string | unknown | undefined;
    message?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const networks = await prisma.smartlink.findMany();
        res.status(200).json({ data: networks });
    } catch (e : unknown) {
        res.status(500).json({ 
            error: e instanceof Error ? e.cause : 'Error fetch',
            message: e instanceof Error ? e.message : 'Error fetch',
        });
    }
}