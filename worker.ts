import { Kafka } from 'kafkajs';
import { prisma } from './src/lib/prisma';

const kafka = new Kafka({
  clientId: 'cpa-worker',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'cpa-group' });

async function run() {
  try {
    console.log("🚀 WORKER STARTING...");
    await prisma.$connect();
    await consumer.connect();
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log(`📦 Received: ${message.value?.toString()}`);
      },
    });
  } catch (error) {
    console.error("❌ Worker Error, restarting in 5s...", error);
    setTimeout(run, 5000);
  }
}

run();