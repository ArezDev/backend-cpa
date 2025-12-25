export function saiki() {
  const now = new Date();
  
  // 1. Ambil tanggal hari ini di Jakarta
  const jakartaDate = now.toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Jakarta' 
  }); // Hasil: "YYYY-MM-DD"

  // 2. Buat string ISO dengan offset +07:00
  // Ini akan menghasilkan jam 7 pagi WIB yang tepat
  const start = new Date(`${jakartaDate}T07:00:00+07:00`);

  // 3. Tambahkan 24 jam untuk mendapatkan jam 7 pagi besok
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { 
    start, 
    end,
    // Helper untuk ngecek apakah outputnya sudah benar dalam format Jakarta
    startISO: start.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    endISO: end.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  };
}