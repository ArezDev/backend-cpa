import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Gunakan jose, bukan jsonwebtoken

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_PATHS = [
    '/api/cek-ip',
    '/api/health',
    '/api/redirect', 
    '/api/networks/list', 
    '/api/users/auth',
    '/api/users/login',
    '/api/short/ix.sk',
    '/api/postplay',
    '/api/postplay/check',
    '/api/realtime/dashboard', 
    '/api/realtime/auth',
    '/api/realtime/login',
    '/api/realtime/postback',
    '/api/realtime/cron/delete-clicks',
];
const ADMIN_PATHS = ['/api/users', '/api/networks/', '/api/networks/list'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    try {
        // 1. Bypass Public Paths
        if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
            return NextResponse.next();
        }

        // 2. Ambil Token
        const token = req.headers.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        // 3. Verifikasi Token dengan jose
        const { payload } = await jwtVerify(token, SECRET);

        // 4. Proteksi Khusus Admin
        if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            if (payload.role !== 'ketua') {
                return NextResponse.json({ 
                    message: 'Unauthorized', 
                    details: 'Not Admin!' 
                }, { status: 401 });
            }
        }
        // Jika sampai sini, token valid (dan role benar jika path admin)
        return NextResponse.next();
        
    } catch (err) {
        return NextResponse.json({ 
            message: 'Invalid or Expired Token', 
            details: err instanceof Error ? err.message : 'Token verification failed'
        }, { status: 401 });
    }
}

export const config = {
    matcher: '/api/:path*',
};