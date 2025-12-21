import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'api-producer',
  brokers: ['kafka:9092'], // Gunakan nama service di docker-compose
});

let producer: any = null;

export const getKafkaProducer = async () => {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
};