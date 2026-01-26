import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // توجيه المسار الجذري إلى /ar
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ar', request.url));
  }

  // توجيه /news إلى /ar/news
  if (pathname === '/news') {
    return NextResponse.redirect(new URL('/ar/news', request.url));
  }

  // توجيه /news/[id] إلى /ar/[id] (صفحة تفاصيل الخبر)
  if (pathname.startsWith('/news/')) {
    const id = pathname.slice('/news/'.length);
    return NextResponse.redirect(new URL(`/ar/${id}`, request.url));
  }

  // ملاحظة: حماية صفحات الإدارة للمستخدم المحدود تتم في layout.tsx و page.tsx
  // لأن middleware يعمل في Edge Runtime ولا يدعم Node.js modules مثل crypto و database queries

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/news', '/news/:path*'],
};
