import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// type Lead = {
//     userId?: string,
//     country?: string,
//     ip?: string,
//     useragent?: string,
//     network?: string
// };

type ResponseData = {
    success: boolean;
    //data?: Lead;
    error?: string;
    message?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        
        const { leads, earn } = req.query;

        if (!leads || !earn) {
            return res.status(400).json({ success: false, message: "Missing parameter!" });
        }

        // Decode base64
        const decodedString = Buffer.from(leads as string, 'base64').toString('utf-8');
        const parts = decodedString.split(",");
        if (parts.length < 5) {
            return res
            .status(400)
            .json({ success: false, message: "Invalid lead id format. Expected 5 parts separated by ," });
        }
        // Create lead in database
        const [userId, country, ip, useragent, network] = parts;
        const earning = Number(earn);
        await prisma.leads.create({
            data: {
                userId,
                country,
                ip,
                useragent,
                network,
                earning
                // Add other fields as needed
            },
        });

        return res.status(201).json({success: true, message: 'Lead successfully saved!'});
    } catch (error: unknown) {
        console.error('Error creating lead:', error);
        return res.status(500).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}