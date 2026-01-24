import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // توجيه المسار الجذري إلى /ar فقط
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ar', request.url));
  }

  // السماح بجميع المسارات الأخرى
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تطبيق على المسار الجذري فقط (/)
     */
    '/'
  ],
};
