// pages/api/cek-ip/index.ts
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import maxmind, { Reader, CityResponse, AsnResponse } from "maxmind";

type Data = {
  ip: string;
  country: string | null;
  country_code: string | null;
  isp: string | null;
  city: string | null;
  region: string | null;
  postal: string | null;
  error?: string;
};

// Global variables untuk caching di level server instance
// Next.js API Routes menjaga state global ini selama server tidak restart (cold start)
let cityLookup: Reader<CityResponse> | null = null;
let asnLookup: Reader<AsnResponse> | null = null;

async function getLookups() {
  const DATA_PATH = path.join(process.cwd(), "data");

  if (!cityLookup) {
    cityLookup = await maxmind.open<CityResponse>(path.join(DATA_PATH, "GeoLite2-City.mmdb"));
  }
  if (!asnLookup) {
    asnLookup = await maxmind.open<AsnResponse>(path.join(DATA_PATH, "GeoLite2-ASN.mmdb"));
  }

  return { cityLookup, asnLookup };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Hanya izinkan POST untuk keamanan data IP
  if (req.method !== "POST") {
    return res.status(405).json({ ip: "unknown", country: null, country_code: null, isp: null, city: null, region: null, postal: null, error: "Method not allowed" });
  }

  try {
    const { ip } = req.body;

    // Validasi IP sederhana
    if (!ip || ip === "unknown") {
      throw new Error("Invalid IP address");
    }

    const { cityLookup, asnLookup } = await getLookups();

    // Jalankan lookup secara paralel untuk efisiensi
    const [geo, asn] = [cityLookup.get(ip), asnLookup.get(ip)];

    res.status(200).json({
      ip,
      country_code: geo?.country?.iso_code ?? null,
      country: geo?.country?.names?.en ?? null,
      isp: asn?.autonomous_system_organization ?? null,
      city: geo?.city?.names?.en ?? null,
      region: geo?.subdivisions?.[0]?.names?.en ?? null,
      postal: geo?.postal?.code ?? null,
    });

  } catch (err: unknown) {
    console.error("Critical GeoIP Error:", (err as Error).message);
    res.status(500).json({ 
      ip: req.body?.ip || "unknown", 
      country_code: null, 
      country: null,
      isp: null,
      city: null,
      region: null,
      postal: null,
      error: "Lookup failed"
    });
  }
}