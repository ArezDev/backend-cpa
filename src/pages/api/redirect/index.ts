import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getIpInfo } from '@/lib/myip';
import { publishEvent } from '@/lib/kafka';
import { saiki } from '@/lib/waktu';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    //get waktu wib
    const { start, end, startISO, endISO } = saiki();
    console.log(`Saiki: ${start}\nSampek: ${end}\n ${startISO}\n ${endISO}`);
    const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
        req.socket.remoteAddress ||
        "";
    //const ip = "182.8.65.124";
    //const ip = "157.240.208.255";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
        );
    console.log(`[Request] Redirect request from IP: ${ip}`);
    console.log(`User-Agent: ${userAgent} (Mobile: ${isMobile})`);
    //get ip info
    const { country_code, isp } = await getIpInfo(ip);

    //block bot trafik
    const blockedIsps = ["Facebook", "Google", "Meta", "Googlebot", "AMAZON-02"];
    if (isp) {
        for (const blocked of blockedIsps) {
            if (isp.toLowerCase().includes(blocked.toLowerCase())) {
                return res.status(403).json({ error: "Access denied!" });
            }
        }
    }

    const { user, network } = req.query;

    if (!user || typeof user !== 'string' || !network || typeof network !== 'string') {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Create click ID
    const networkId = network.includes("IMO")
    ? "IMONETIZEIT"
    : network.includes("LP")
    ? "TORAZZO"
    : network.includes("TF")
    ? "LOSPOLLOS"
    : network.includes("GLB")
    ? "GLOBAL"
    : network;
    const makeClickId = 
    Buffer.from(`${user},${country_code || 'XX'},${ip},${isMobile ? 'WAP' : 'WEB'},${networkId}`).toString('base64url');
    console.log(`Generated Click ID: ${makeClickId}`);
    const clickId = makeClickId
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

    // get app
    const sourceType = userAgent.includes("Instagram")
    ? "instagram"
    : userAgent.includes("Barcelona")
    ? "threads"
    : userAgent.includes("[FBAN")
    ? "facebook"
    : userAgent.includes("[FB_IAB")
    ? "facebook"
    : userAgent.includes("/FBIOS")
    ? "facebook"
    : userAgent.includes(";FBAV")
    ? "facebook"
    : userAgent.includes(";FBDV")
    ? "facebook"
    : userAgent.includes("Chrome")
    ? "chrome"
    : userAgent.includes("Safari")
    ? "safari"
    : userAgent.includes("Firefox")
    ? "firefox"
    : "default";

    const cacheKey = `redirect:${user}:${network}:${clickId}:${userAgent}`;

    try {

        // 1. Check Redis cache first
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            // --- ADDED LOG FOR CACHE HIT ---
            console.log(`[Cache Hit] Serving redirect for ${user} on ${network} from Redis.`);

            //push user summary
            await updateSummaryUser(
                user,
                networkId,
                country_code,
                userAgent,
                sourceType,
                ip,
                start, 
                end
            );
            
            // Fire and forget Kafka event
            publishEvent('redirek-link', user, 'redirect', 'cached').catch(console.error);
            
            return res.status(200).json({
                status: true,
                cacheRedis: true,
                clickId: cached,
                message: 'Click ID generated successfully',
            });
        }

        // --- CACHE MISS: DATABASE LOOKUP ---
        console.log(`[Cache Miss] Querying database for ${user} on ${network}.`);

        // Validate user
        const userku = await prisma.users.findUnique({
            where: { username: user }
        });

        if (!userku) {
            return res.status(404).json({ error: 'User not found' });
        }

        //push user summary
        await updateSummaryUser(
            user,
            networkId,
            country_code,
            userAgent,
            sourceType,
            ip,
            start, 
            end
        );

        // 2. Cache the result (expire in 1 hour)
        await redis.set(cacheKey, clickId, 'EX', 3600);

        // 3. Publish event to Kafka
        publishEvent('redirek-link', user, 'redirect', 'success').catch(console.error);

        //return res.redirect(302, redirectUrl.url);
        return res.status(200).json({
            status: true,
            cacheRedis: false,
            clickId,
            message: 'Click ID generated successfully',
        });

    } catch (error : unknown) {
        console.error('Redirect error:', error);
        return res.status(500).json({ 
            status: false,
            message: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
}

async function updateSummaryUser
(
    user: string, 
    network: string,
    country: string | null,
    source: string,
    gadget: string,
    ip: string,
    start: Date, 
    end: Date
) {
    const userPerformance = await prisma.user_summary.findMany(
            {
                where: {
                    user,
                    created_at: {
                        gte: start,
                        lte: end
                    }
                },
            }
    );
    console.log('usersummary count: ', userPerformance.length)
    if (userPerformance.length === 0) {
            console.log(`Summary ${user} not exist, creating...`);
            await prisma.user_summary.create({
                data: {
                    user,
                    total_click: 1,
                }
            })
    } else {
            console.log(`Summary ${user} exist, updating...`);
            await prisma.user_summary.updateMany({
                where: {
                    user
                },
                data: {
                    total_click: {
                        increment: 1
                    }
                }
            });
    }
    //update live_clicks
    await prisma.live_clicks.create({
        data: {
            user,
            network,
            country,
            source,
            gadget,
            ip
        }
    });
    //update clicks
    await prisma.clicks.create({
        data: {
            user,
            network,
            country,
            source,
            gadget,
            ip
        }
    });
}