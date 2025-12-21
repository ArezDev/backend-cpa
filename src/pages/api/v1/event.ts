import type { NextApiRequest, NextApiResponse } from 'next';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'api-producer',
  brokers: [process.env.KAFKA_BROKER || 'kafka-broker:29092'],
});

const producer = kafka.producer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await producer.connect();
    
    await producer.send({
      topic: 'events',
      messages: [
        { value: JSON.stringify(req.body) },
      ],
    });

    return res.status(202).json({ success: true, message: 'Event Sent' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Optional: Untuk high-traffic, pertimbangkan tidak disconnect setiap request
    await producer.disconnect();
  }
}