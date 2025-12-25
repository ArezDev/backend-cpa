"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
// 1. Inisialisasi Kafka Client
const kafka = new kafkajs_1.Kafka({
    clientId: 'worker-client',
    brokers: ['localhost:9092'], // Kafka lokal Anda di Docker
});
// 2. Definisi variabel consumer
const consumer = kafka.consumer({ groupId: 'framework-group' });
// const runWorker = async () => {
//   try {
//     // Koneksi ke Consumer
//     await consumer.connect();
//     console.log('✅ Worker Kafka Connected');
//     // Subscribe ke topik tertentu
//     await consumer.subscribe({ topic: 'events', fromBeginning: true });
//     // 3. Jalankan Logika Consumer
//     await consumer.run({
//       eachMessage: async ({ topic, partition, message }) => {
//         const content = message.value?.toString();
//         if (content) {
//           try {
//             const jsonData = JSON.parse(content);
//             console.log(`📩 Pesan diterima:`, jsonData);
//             // Simpan ke MySQL Ubuntu via Prisma
//             await prisma.kafkaEvent.create({
//               data: {
//                 topic: topic,
//                 payload: jsonData,
//               },
//             });
//             console.log('🚀 Data berhasil disimpan ke MySQL Ubuntu!');
//           } catch (parseError) {
//             console.error('❌ Gagal memproses pesan:', parseError);
//           }
//         }
//       },
//     });
//   } catch (error) {
//     console.error('❌ Worker Error:', error);
//   }
// };
//runWorker();
