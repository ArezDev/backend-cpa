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
};

// update di server
let cityLookup: Reader<CityResponse> | null = null;
let asnLookup: Reader<AsnResponse> | null = null;

// Lazy load supaya nggak reopen DB tiap request
async function loadDbs() {
  if (!cityLookup) {
    const cityDbPath = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
    // update server
    cityLookup = await maxmind.open(cityDbPath) as Reader<CityResponse>;
  }
  if (!asnLookup) {
    const asnDbPath = path.join(process.cwd(), "data", "GeoLite2-ASN.mmdb");
    // update server
    asnLookup = await maxmind.open(asnDbPath) as Reader<AsnResponse>;
  }
  return { cityLookup, asnLookup };
}

export const getIpInfo = async (ip: string): Promise<Data> => {
  const { cityLookup, asnLookup } = await loadDbs();

  const cityResponse = cityLookup.get(ip);
  const asnResponse = asnLookup.get(ip);

  return {
    ip,
    country: cityResponse?.country?.names?.en || null,
    country_code: cityResponse?.country?.iso_code || null,
    isp: asnResponse?.autonomous_system_organization || null,
    city: cityResponse?.city?.names?.en || null,
    region: cityResponse?.subdivisions?.[0]?.names?.en || null,
    postal: cityResponse?.postal?.code || null,
  };
}