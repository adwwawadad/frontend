import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // MongoDB admin session kontrolü
  const adminSession = request.cookies.get('admin_session')
  const isAuth = !!adminSession?.value
  
  const isAuthPage = request.nextUrl.pathname === '/admin'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin/sistem')

  // IP adresini almaya çalış
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown-ip'
  
  // Headers'a custom IP ekle (route handler'lar tarafından kullanılabilir)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-real-client-ip', ip)

  if (isProtectedRoute && !isAuth) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/admin/sistem', request.url))
  }

  // IP adresini header'a ekleyerek yanıtı döndür
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)']
}