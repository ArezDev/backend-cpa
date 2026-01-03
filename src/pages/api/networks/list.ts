import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET as string;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const cekAuth = jwt.verify(token, SECRET);
    if (!cekAuth) return res.status(401).json({ message: 'Unauthorized Invalid Session!' });
    try {
        const networks = await prisma.smartlinks.findMany();
        return res.status(200).json(networks);
    } catch (e : unknown) {
        res.status(500).json({ 
            error: e instanceof Error ? e.cause : 'Error fetch',
            message: e instanceof Error ? e.message : 'Error fetch',
        });
    }
}