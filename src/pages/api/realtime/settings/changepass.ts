import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const sessions = req.headers?.authorization?.split(' ')[1] as string;
    if (!sessions) return res.status(401).json({ message: 'Unauthorized!' });

    try {
        if (req.method === 'POST') {
            const isAdmin = jwt.verify(sessions, process.env.JWT_SECRET as string);

            if (!isAdmin || typeof isAdmin === 'string') {
                return res.status(401).json({ status: false, message: 'Token Invalid!' });
            }

            if (isAdmin.role !== 'ketua') {
                return res.status(401).json({ message: 'Not Admin!' });
            }

            // 1. Ambil password dari body
            const { password } = req.body;

            // 2. VALIDASI DULU (Pindahkan ke sini)
            if (!password) {
                return res.status(400).json({ error: 'Missing required fields: password' });
            }

            // 3. Baru lakukan hashing setelah dipastikan password ada
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const realtime = await prisma.realtime_access.update({
                where: { id: 1 },
                data: { password: hashedPassword },
                select: { password: true }
            });

            return res.status(200).json({ status: 'ok', realtime, message: 'Password realtime updated!' });
        } else {
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: unknown) {
        return res.status(500).json({ error: 'Error API', details: (error as Error).message });
    } finally {
        await prisma.$disconnect();
    }
}