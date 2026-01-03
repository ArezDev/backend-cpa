import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Ambil token dari Cookies
        const token = req.cookies['token']; 

        if (!token) {
            return res.status(401).json({ authenticated: false, message: 'No token found' });
        }

        // 2. Verifikasi dengan jose (Konsisten dengan Middleware)
        const { payload } = await jwtVerify(token, SECRET);

        // 3. Check access ke database berdasarkan ID
        // Tidak perlu cek password di sini untuk efisiensi
        const auth = await prisma.realtime_access.findUnique({
            where: {
                id: payload.id as number,
            }
        });

        if (!auth || auth.role !== payload.role) {
            return res.status(401).json({ authenticated: false, message: 'User not found or role changed' });
        }

        // 4. Berhasil
        return res.status(200).json({ 
            authenticated: true, 
            user: {
                id: auth.id,
                role: auth.role
            } 
        });

    } catch (e: unknown) {
        console.error("Auth API Error:", e);
        return res.status(401).json({
            authenticated: false,
            message: 'Invalid or expired token'
        });
    }
}