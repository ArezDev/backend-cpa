import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type ResponseData = {
    status?: string;
    data?: string | null;
    error?: string;
    message?: string;
};

// Helper shortcode
const getShortcode = (count: number, length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const uniqueStrings = new Set<string>();
    while (uniqueStrings.size < count) {
      let randomString = "";
      for (let j = 0; j < length; j++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      uniqueStrings.add(randomString);
    }
    return Array.from(uniqueStrings);
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // cek method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // start API
    try {
        // jupok payload
        const { url, title, descr, img, userId, encode } = req.body;
        if (!url || !title || !img || !userId) return res.status(400).json({ message: 'Title atau Gambar belum terisi !' });
        let encryptShort = '';
        if (!encode) { 
            encryptShort = getShortcode(1, 7)[0];
        }
        // koneksi db
        const short = await prisma.postplay_redirect.create({
            data: {
                title,
                descr: descr,
                img,
                user_id: userId,
                shortcode: encode ? encode : encryptShort,
                url,
                useragent: ''
            },
        });
        // kosong?
        if (!short) res.status(500).json({ status: 'fail', data: null });
        // Sukses...
        return res.status(200).json({ status: 'ok', data: short?.shortcode });
    } catch (error: unknown) {
        console.error('Error short postplay:', error);
        return res.status(500).json({ 
            status: 'fail', 
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}