import type { NextApiRequest, NextApiResponse } from 'next';
import mariadb from 'mariadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let conn;
  try {
    console.log("🔍 [DEBUG DB] Mencoba koneksi ke 100.68.36.87...");

    // Buat koneksi tunggal (bukan pool) untuk pengetesan murni
    conn = await mariadb.createConnection({
      host: '100.68.36.87',
      user: 'zdevbackend',
      password: '0mn1vor4',
      database: 'redirect_link',
      port: 3306,
      connectTimeout: 20000 // Tunggu hingga 20 detik
    });

    console.log("✅ [DEBUG DB] Handshake Berhasil!");

    // Jalankan query sederhana
    const rows = await conn.query("SELECT 1 + 1 AS hasil_tes");

    // Fungsi untuk menangani BigInt agar bisa dikirim sebagai JSON
    const safeData = JSON.parse(
      JSON.stringify(rows, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return res.status(200).json({
      message: "Koneksi Database Sukses!",
      server_info: conn.serverVersion(),
      query_result: safeData
    });

  } catch (err: any) {
    console.error("❌ [DEBUG DB] Error Detail:", err.message);
    
    return res.status(500).json({
      status: "Gagal",
      error_message: err.message,
      troubleshoot: "Pastikan database 100.68.36.87 mengizinkan koneksi dari IP Docker Anda."
    });
  } finally {
    // Selalu tutup koneksi setelah selesai
    if (conn) {
      await conn.end();
      console.log("🔌 [DEBUG DB] Koneksi ditutup.");
    }
  }
}