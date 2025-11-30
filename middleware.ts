import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    // Check for Admin Route
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const authHeader = request.headers.get('authorization');

        if (authHeader) {
            const authValue = authHeader.split(' ')[1];
            const [user, pwd] = atob(authValue).split(':');

            const validUser = process.env.ADMIN_USERNAME || 'admin';
            const validPass = process.env.ADMIN_PASSWORD;

            if (user === validUser && pwd === validPass) {
                return NextResponse.next();
            }
        }

        return new NextResponse('Auth Required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // Otherwise, run intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames AND admin
    matcher: ['/', '/(es|en)/:path*', '/admin/:path*']
};
