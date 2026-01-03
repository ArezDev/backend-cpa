import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import jwt from "jsonwebtoken";

type ResponseData = {
    success?: boolean;
    message?: string;
    data?: string;
    error?: string;
    details?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const SECRET = process.env.JWT_SECRET as string;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await prisma.users.findUnique({
            where: { username },
        });

        // Pakai pesan yang sama untuk user tidak ketemu & password salah demi keamanan
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const buatSesi = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            SECRET,
            { expiresIn: user.role === "ketua" ? "30m" : "1d" }
        );

        // Opsi: Jika ingin menggunakan Cookie agar lebih aman (HttpOnly)
        res.setHeader('Set-Cookie', `token=${buatSesi}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);

        return res.status(200).json({ 
            success: true,
            message: 'Login successful',
            data: buatSesi // Token dikirim ke body untuk disimpan di LocalStorage/State
        });

    } catch (e: unknown) {
        console.error(e);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: e instanceof Error ? e.message : 'Unknown error'
        });
    }
}