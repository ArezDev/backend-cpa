import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { Kafka } from 'kafkajs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const timestamp = new Date().toISOString();

    // 1. TEST DATABASE
    console.log("🔍 Mencoba koneksi database...");
    await prisma.$connect(); // Cukup panggil tanpa menampung return value
    
    // Untuk memastikan DB benar-benar merespon, gunakan query simpel
    const dbTest = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("Database connected!");

    // 2. TEST REDIS
    console.log("🔍 Mencoba koneksi Redis...");
    await redis.set('test_koneksi_last_run', timestamp, 'EX', 3600);
    const redisVal = await redis.get('test_koneksi_last_run');

    // 3. TEST KAFKA (Producer)
    console.log("🔍 Mencoba koneksi Kafka...");
    const kafka = new Kafka({
      brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
      clientId: 'backend-test-client',
    });
    
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'test-topic',
      messages: [{ value: `Test koneksi pada ${timestamp}` }],
    });
    await producer.disconnect();

    // 4. SERIALISASI DATA (Hanya jika data mengandung BigInt)
    // Gunakan dbTest, bukan dbConnect
    const serializedDb = JSON.parse(
      JSON.stringify(dbTest, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    // 5. RESPONSE FINAL
    return res.status(200).json({
      status: "Semua Koneksi Berhasil! ✅",
      services: {
        database: { status: "OK", data: serializedDb }, // Sekarang aman
        redis: { status: "OK", last_timestamp: redisVal },
        kafka: { status: "OK", topic: "test-topic" }
      }
    });

  } catch (error: any) {
    console.error("❌ Test Koneksi Gagal:", error.message);
    
    return res.status(500).json({
      status: "Gagal ❌",
      error: error.message,
      hint: "Jika database timeout 10s, pastikan allowPublicKeyRetrieval sudah TRUE di lib/prisma.ts"
    });
  }
}