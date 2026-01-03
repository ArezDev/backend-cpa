// helpers/time.ts
import dayjs, { WIB_TZ } from "@/lib/dayjs";

// ❗ Set ini sesuai isi kolom DATETIME kamu:
// true  = nilai di DB tersimpan sebagai UTC pada kolom DATETIME (gejala “jam 12 siang”)
// false = nilai di DB tersimpan sebagai WIB apa adanya
const DB_IS_UTC_DATETIME = true;            
const DB_SHIFT_HOURS = DB_IS_UTC_DATETIME ? -7 : 0; // kirim WIB→UTC: -7 jam

export function getSummaryWIB(saiki?: number | string | Date, sampek?: number | string | Date) {
  const startBase = dayjs(saiki ?? Date.now(), WIB_TZ);
  const endBase = dayjs(sampek ?? saiki ?? Date.now(), WIB_TZ);

  // start = 07:00 WIB di tanggal "saiki"
  const startWIB = startBase.hour(7).minute(0).second(0).millisecond(0);

  // end = 06:59:59 WIB di tanggal "sampek" (berarti keesokan harinya)
  const endWIB = endBase.add(1, "day").hour(6).minute(59).second(59).millisecond(999);

  // Geser ke waktu DB (misal UTC)
  const toDB = (d: dayjs.Dayjs) => d.add(DB_SHIFT_HOURS, "hour");

  return {
    startDate: toDB(startWIB).format("YYYY-MM-DD HH:mm:ss"),
    endDate:   toDB(endWIB).format("YYYY-MM-DD HH:mm:ss"),
    debug: {
      saiki: startBase.format("YYYY-MM-DD"),
      sampek: endBase.format("YYYY-MM-DD"),
      startWIB: startWIB.format("YYYY-MM-DD HH:mm:ss"),
      endWIB:   endWIB.format("YYYY-MM-DD HH:mm:ss"),
      startDB:  toDB(startWIB).format("YYYY-MM-DD HH:mm:ss"),
      endDB:    toDB(endWIB).format("YYYY-MM-DD HH:mm:ss"),
    }
  };
}

export function getCurrentWibWindowForDB(nowInput?: number | Date) {
  const nowWIB = dayjs(nowInput ?? Date.now()).tz(WIB_TZ);

  // Logika jam 7 pagi Anda
  const startWIB = (nowWIB.hour() < 7
    ? nowWIB.subtract(1, "day")
    : nowWIB
  ).hour(7).minute(0).second(0).millisecond(0);

  const endWIB = startWIB.add(1, "day");

  // Fungsi konversi ke Date objek (Prisma paling suka ini)
  // DB_SHIFT_HOURS biasanya tidak diperlukan jika Prisma & DB sudah sinkron UTC
  // Tapi jika Anda tetap ingin manual shift:
  const toDBDate = (d: dayjs.Dayjs) => d.add(DB_SHIFT_HOURS, "hour").toDate();

  return {
    start: toDBDate(startWIB), // Menghasilkan Objek Date
    end:   toDBDate(endWIB),   // Menghasilkan Objek Date
    debug: {
      startWIB: startWIB.format("YYYY-MM-DD HH:mm:ss"),
      endWIB:   endWIB.format("YYYY-MM-DD HH:mm:ss"),
      startDB:  toDBDate(startWIB).toISOString(),
      endDB:    toDBDate(endWIB).toISOString(),
    }
  };
}