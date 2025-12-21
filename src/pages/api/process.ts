import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getKafkaProducer } from '@/lib/kafka';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { payload } = req.body;

    // 1. Database Transaction (MySQL via Prisma 7)
    const dbResult = await prisma.dataEntry.create({
      data: { content: payload, status: 'PROCESSED' }
    });

    // 2. Cache Update (Redis) - Set expiry 1 jam
    await redis.set(`data:${dbResult.id}`, JSON.stringify(dbResult), 'EX', 3600);

    // 3. Message Queue (Kafka)
    const producer = await getKafkaProducer();
    await producer.send({
      topic: 'data-processed',
      messages: [{ value: JSON.stringify({ id: dbResult.id, time: new Date() }) }],
    });

    return res.status(200).json({ status: 'success', data: dbResult });
  } catch (error : any) {
    console.error("Worker Error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}