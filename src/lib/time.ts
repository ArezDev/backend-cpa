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

  // start = 05:00 WIB untuk hari ini jika >=05:00; kalau belum, pakai 05:00 WIB kemarin
  const startWIB = (nowWIB.hour() < 7
    ? nowWIB.subtract(1, "day")
    : nowWIB
  ).hour(7).minute(0).second(0).millisecond(0);

  const endWIB = startWIB.add(1, "day"); // half-open [start, end)

  const toDB = (d: dayjs.Dayjs) => d.add(DB_SHIFT_HOURS, "hour"); // -7h jika DB UTC-DATETIME
  return {
    startStr: toDB(startWIB).format("YYYY-MM-DD HH:mm:ss"),
    endStr:   toDB(endWIB).format("YYYY-MM-DD HH:mm:ss"),
    debug: {
      startWIB: startWIB.format("YYYY-MM-DD HH:mm:ss"),
      endWIB:   endWIB.format("YYYY-MM-DD HH:mm:ss"),
      startDB:  toDB(startWIB).format("YYYY-MM-DD HH:mm:ss"),
      endDB:    toDB(endWIB).format("YYYY-MM-DD HH:mm:ss"),
    }
  };
}