import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'api-producer',
  brokers: ['kafka:9092'], // Gunakan nama service di docker-compose
});

// let producer: any = null;
const producer = kafka.producer();
let connected = false;

async function getKafkaProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    }
  return producer;
};

export async function publishEvent(topic: string, user: string, action: string, status: string) {
    try {
        const producer = await getKafkaProducer();
        await producer.send({
            topic,
            messages: [
                {
                    key: user,
                    value: JSON.stringify({
                        user,
                        action,
                        status,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
    } catch (error) {
        console.error('Kafka publish error:', error);
    }
}