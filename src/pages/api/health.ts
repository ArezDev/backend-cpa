import type { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';
import { Kafka } from 'kafkajs';

// Definisikan Interface untuk Type Safety (Menghindari 'any')
interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    redis: 'up' | 'down' | 'unknown';
    kafka: 'up' | 'down' | 'unknown';
  };
}

export default async function handler(
  _req: NextApiRequest, // Gunakan underscore jika parameter tidak dipakai
  res: NextApiResponse<HealthStatus>
) {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: 'unknown',
      kafka: 'unknown',
    }
  };

  // 1. Cek Koneksi Redis
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
      connectTimeout: 2000,
      lazyConnect: true, // Optimasi koneksi
    });
    const ping = await redis.ping();
    healthStatus.services.redis = ping === 'PONG' ? 'up' : 'down';
    await redis.quit();
  } catch {
    // Menghapus 'error' karena tidak digunakan
    healthStatus.services.redis = 'down';
    healthStatus.status = 'unhealthy';
  }

  // 2. Cek Koneksi Kafka
  try {
    const kafka = new Kafka({
      brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
      retry: { retries: 0 }
    });
    const admin = kafka.admin();
    await admin.connect();
    await admin.disconnect();
    healthStatus.services.kafka = 'up';
  } catch {
    // Menghapus 'error' karena tidak digunakan
    healthStatus.services.kafka = 'down';
    healthStatus.status = 'unhealthy';
  }

  const responseCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(responseCode).json(healthStatus);
}