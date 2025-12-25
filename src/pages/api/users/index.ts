import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    try {

        if (req.method === 'GET') {
            const users = await prisma.users.findMany(
                {
                    where: {role: 'member'}
                }
            );
            res.status(200).json(users);
        } else if (req.method === 'POST') {
            const { username, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            if (!username || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const user = await prisma.users.create({
                data: {
                    username,
                    password: hashedPassword,
                },
            });
            res.status(201).json(user);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error : unknown) {
        res.status(500).json({ error: 'Error API', details: error instanceof Error ? error.message : String(error) });
    } finally {
        await prisma.$disconnect();
    }
}