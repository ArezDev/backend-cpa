import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getIpInfo } from '@/lib/myip';
import { publishEvent } from '@/lib/kafka';
import dayjs from 'dayjs';
//import { getCurrentWibWindowForDB } from '@/lib/time';
//import { saiki } from '@/lib/waktu';

// Map untuk identifikasi network agar lebih clean
const NETWORK_MAP: Record<string, string> = {
    'IMO': 'IMONETIZEIT',
    'LP': 'TORAZZO',
    'TF': 'LOSPOLLOS',
    'GLB': 'GLOBAL'
};

// Map untuk identifikasi source app
const SOURCE_PATTERNS = [
    { key: 'instagram', pattern: /Instagram/i },
    { key: 'threads', pattern: /Barcelona/i },
    { key: 'facebook', pattern: /\[FBAN|\[FB_IAB|\/FBIOS|;FBAV|;FBDV/i },
    { key: 'chrome', pattern: /Chrome/i },
    { key: 'safari', pattern: /Safari/i },
    { key: 'firefox', pattern: /Firefox/i },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        //const { start, end } = getCurrentWibWindowForDB();
        //const nowJS = new Date();
        const nowUTC = dayjs().add(5, "hour");
        const start = nowUTC.startOf("day").toDate();
        const end = nowUTC.endOf("day").toDate();
        
        const userAgent = req.headers["user-agent"] || "Unknown";
        
        // Dapatkan IP & Cek Bot ISP seawal mungkin
        const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "";
        const { country_code, isp } = await getIpInfo(ip);
        const blockedIsps = ["Facebook", "Google", "Meta", "Googlebot", "AMAZON-02"];
        if (isp && blockedIsps.some(b => isp.toLowerCase().includes(b.toLowerCase()))) {
            return res.status(403).json({ error: "Access denied!" });
        }

        // Parameter Validation
        const { user, network } = req.query;
        if (typeof user !== 'string' || typeof network !== 'string') {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        // Logic Mapping (Network & Source)
        const networkId = Object.entries(NETWORK_MAP).find(([key]) => network.includes(key))?.[1] || network;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const sourceType = SOURCE_PATTERNS.find(s => s.pattern.test(userAgent))?.key || "default";

        // Generate Click ID (Clean Base64)
        const clickId = Buffer.from(`${user},${country_code || 'XX'},${ip},${isMobile ? 'WAP' : 'WEB'},${networkId}`)
            .toString('base64url');

        // Cek GlobalNetwork (GLB)
        

        // Check GlobalTraffic
        let isGlobalNetwork = false;
        const countryClient = country_code?.toUpperCase() || "XX";
        try {
        if (network.includes("GLB")) {
            // 1. Ganti Axios dengan Prisma Query (Lebih Cepat)
            const smartlink = await prisma.smartlinks.findFirst({
            where: { 
                network: "GLB" // Opsional: pastikan hanya ambil yang aktif
            },
            select: { 
                allowed: true 
            }
            });
            if (smartlink?.allowed) {
            // Set untuk pencarian yang lebih cepat jika datanya banyak
            const allowedSet = new Set(
                smartlink.allowed.split(",").map((c: string) => c.trim().toUpperCase())
            );
            isGlobalNetwork = allowedSet.has(countryClient);
            }
            console.log(`[GLB Check] Country: ${countryClient}, Allowed: ${isGlobalNetwork}`);
        }
        } catch (error) {
        console.error("Error checking global network:", error);
        // Default isGlobalNetwork tetap false
        }

        // Generate url cpa
        const redirek = await getNetworks(user, network, clickId);

        if (!redirek.success) return res.status(500).json({ error: redirek?.message });

        const cacheKey = `redirect:${user}:${network}:${clickId}:${userAgent}`;

        // Redis Check
        const cached = await redis.get(cacheKey);
        if (cached) {
            // Background tasks (Fire and forget)
            updateSummaryUser(user, networkId, country_code, userAgent, sourceType, ip, start, end).catch(console.error);
            publishEvent('redirek-link', user, 'redirect', 'cached').catch(console.error);

            return res.status(200).json({ 
                status: true, 
                cacheRedis: true,
                url: isGlobalNetwork ? (await getNetworks(user, 'TF', clickId)).data : redirek?.data 
            });
        }

        // Database Validation (Hanya dijalankan jika cache miss)
        const userExists = await prisma.users.findUnique({ where: { username: user }, select: { id: true } });
        if (!userExists) return res.status(404).json({ error: 'User not found' });

        // Update DB & Cache (Parallel)
        await Promise.all([
            redis.set(cacheKey, `${clickId}`, 'EX', 3600),
            updateSummaryUser(user, networkId, country_code, userAgent, sourceType, ip, start, end)
        ]);

        publishEvent('redirek-link', user, 'redirect', 'success').catch(console.error);

        return res.status(200).json({ 
            status: true, 
            cacheRedis: false, 
            url: isGlobalNetwork ? (await getNetworks(user, 'TF', clickId)).data : redirek?.data
        });

    } catch (error) {
        console.error('Redirect error:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getNetworks(
    user:string,
    network:string,
    clickId:string
) {
    try {
        // Generate network untuk redirek cpa
        const redirectURL = await prisma.smartlinks.findFirst({ where: { network } });
        // cek network?
        if (!redirectURL) return { success: false, data: null, message: 'Network not found!' }
        // Generate url gawe redirek cpa
        const redirekCPA = redirectURL.url.replaceAll('{user}', user).replaceAll('{leads}', clickId);
        return {
            success: true,
            data: redirekCPA,
            message: 'Network OK!'
        }
    } catch (e:unknown) {
        return {
            success: false,
            data: null,
            message: e instanceof Error ? e.message : 'ERROR SERVER!'
        }
    }
}

async function updateSummaryUser(
    user: string, network: string, country: string | null,
    source: string, gadget: string, ip: string, 
    start: Date, end: Date
) {
    try {
        // 1. Cari record yang jam-nya PAS dengan awal window (Anchor)
        // Kita tidak pakai gte/lte di sini supaya tidak bingung kalau ada banyak row
        const existingSummary = await prisma.user_summary.findFirst({
            where: {
                user: user,
                created_at: start // Mencari yang tepat di jam 07:00:00 (atau sesuai DB_SHIFT)
            },
            select: { id: true }
        });

        let summaryAction;

        if (existingSummary) {
            // JIKA ADA: Update row tersebut
            summaryAction = prisma.user_summary.update({
                where: { id: existingSummary.id },
                data: { 
                    total_click: { increment: 1 },
                    updated_at: new Date() 
                }
            });
            console.log(`✅ [UPDATE] User: ${user} | DATE: ${start.toISOString()} ${end.toISOString()}`);
        } else {
            // JIKA TIDAK ADA: Create row baru dan KUNCI created_at ke 'start'
            summaryAction = prisma.user_summary.create({
                data: { 
                    user: user, 
                    total_click: 1,
                    created_at: start, // PENTING: Jangan pakai default NOW(), pakai 'start'
                    total_earning: 0,
                    total_lead: 0
                }
            });
            console.log(`➕ [CREATE] User: ${user} | DATE: ${start.toISOString()} ${end.toISOString()}`);
        }

        // 2. Jalankan log klik secara paralel
        await Promise.all([
            summaryAction,
            prisma.live_clicks.create({
                data: { user, network, country, source, gadget, ip }
            }),
            prisma.clicks.create({
                data: { user, network, country, source, gadget, ip }
            })
        ]);
        
    } catch (error) {
        console.error(`[DB Error] Update Summary for ${user} failed:`, error);
    }
}