import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    try {
        
        if(req.method === 'PUT') {
            const { id } = req.query;
            const { username, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            if (!id) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            let dataToUpdate: any = {};
            if (username) dataToUpdate.username = username;
            if (password) dataToUpdate.password = hashedPassword;
            const user = await prisma.users.update({
                where: { id: Number(id) },
                data: dataToUpdate,
            });

            res.status(200).json(user);

        } else if(req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const user = await prisma.users.delete({
                where: { id: Number(id) },
            });
            res.status(200).json(user);
        } else {
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }

    } catch (error : unknown) {
        res.status(500).json({ error: 'Error API', details: (error as Error).message });
    } finally {
        await prisma.$disconnect();
    }
}