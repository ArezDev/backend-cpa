import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type ResponseData = {
    status?: string;
    data?: string | null | object;
    error?: string;
    message?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // cek method
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // start API
    try {
        // jupok payload
        const { shortcode } = req.query;
        // cek payload?
        if (
            typeof shortcode !== 'string' || 
            shortcode.includes('chrome') || 
            shortcode.endsWith('.json') ||
            shortcode.endsWith('.map') // Source maps juga sering bikin 404
        ) {
            return res.status(404).end();
        }
        // koneksi db
        const short = await prisma.postplay_redirect.findFirst({
            where: {
                shortcode
            },
            select: {
                title: true,
                descr: true,
                img: true,
                url: true,
            }
        });
        // kosong?
        if (!short) res.status(404).json({ message: 'Shortlink tidak ditemukan' });
        // Update hits +1 & useragent
        const updateHits = await prisma.postplay_redirect.update({
            where: {
                shortcode
            },
            data: {
                hits: {
                    increment: 1
                },
                useragent: req.headers['user-agent'] || 'Unknown'
            }
        });
        if (!updateHits) return res.status(404).json({ status: 'fail', data: null, message: `hits not updated on ${shortcode}` });
        // Sukses...
        return res.status(200).json({ status: 'ok', data: short });
    } catch (error: unknown) {
        console.error('Error short postplay:', error);
        return res.status(500).json({ 
            status: 'fail', 
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}