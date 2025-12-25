import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as tar from "tar";

dotenv.config({ path: ".env" });

const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
if (!LICENSE_KEY) {
  console.error("❌ MAXMIND_LICENSE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function downloadAndExtract(edition: string) {
  const url = `https://download.maxmind.com/app/geoip_download?edition_id=${edition}&license_key=${LICENSE_KEY}&suffix=tar.gz`;
  const dest = path.join(DATA_DIR, `${edition}.tar.gz`);

  console.log(`⬇️ Downloading ${edition}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${edition}: ${res.statusText}`);

  // simpan tar.gz ke disk
  const fileStream = fs.createWriteStream(dest);
  await new Promise<void>((resolve, reject) => {
    (res.body as NodeJS.ReadableStream).pipe(fileStream);
    res.body?.on("error", reject);
    fileStream.on("finish", () => resolve());
  });

  console.log(`📦 Extracting ${edition}...`);
  await new Promise<void>((resolve, reject) => {
    tar
      .x({
        file: dest,
        cwd: DATA_DIR,
        strip: 1,
        filter: (p: string) => p.endsWith(".mmdb"),
      })
      .then(() => resolve())
      .catch((err : any) => reject(err));
  });

  fs.unlinkSync(dest);
  console.log(`✅ ${edition} siap di ${DATA_DIR}`);
}

(async () => {
  try {
    await downloadAndExtract("GeoLite2-City");
    await downloadAndExtract("GeoLite2-ASN");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
