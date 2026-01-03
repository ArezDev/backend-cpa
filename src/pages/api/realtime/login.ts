import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const SECRET = process.env.JWT_SECRET as string;

    // 1. Pastikan Method Benar
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        // 2. Validasi input
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // 3. Cek user/password di database
        const passtementah = await prisma.realtime_access.findFirst({
            where: { role: 'uwong' }
        });

        if (!passtementah) {
            return res.status(404).json({ error: 'Access record not found' });
        }

        // 4. Bandingkan Password
        const isMatch = await bcrypt.compare(password, passtementah.password);

        if (isMatch) {
            // JIKA COCOK: Generate Token
            const token = jwt.sign(
                {
                    id: passtementah.id,
                    role: passtementah.role,
                },
                SECRET,
                { expiresIn: '1d' }
            );

            res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`); // 1 day = 86400s
            
            // Tambahkan RETURN di sini
            return res.status(200).json({ success: true });
        } else {
            // JIKA TIDAK COCOK: Harus kirim respon juga!
            return res.status(401).json({ success: false, message: 'Password salah!' });
        }

    } catch (e: unknown) {
        console.error(e);
        return res.status(500).json({
            success: false,
            error: e instanceof Error ? e.message : 'Internal server Error'
        });
    }
}