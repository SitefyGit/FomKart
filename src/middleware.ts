import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const ref = url.searchParams.get('ref')

  // If there's a ref param, set a 30-day httpOnly cookie and strip the param
  // to avoid infinite redirect loops
  if (ref && ref.trim().length > 0) {
    // Remove the ref param from the URL to prevent loops
    url.searchParams.delete('ref')
    const response = NextResponse.redirect(url)
    response.cookies.set('fomkart_ref', ref.trim(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/start', '/auth/signup', '/auth/creator-signup'],
}
