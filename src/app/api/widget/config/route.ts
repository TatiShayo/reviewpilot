import { NextRequest, NextResponse } from 'next/server'
import { verifyWidgetEmbedToken, getWidgetSecurityHeaders } from '@/lib/embed-token'
import { defaultWidgetConfig } from '@/lib/widget-config'
import { checkRateLimit } from '@/lib/rate-limit'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getWidgetSecurityHeaders(['*'], origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Missing widget embed token' },
      { status: 400, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  // Rate limit widget config requests by IP
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown-ip'
  const rl = checkRateLimit(`widget-config:${clientIp}`, 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  const verification = verifyWidgetEmbedToken(token, origin)
  if (!verification.valid || !verification.payload) {
    return NextResponse.json(
      { error: verification.error || 'Unauthorized embed token' },
      { status: 401, headers: getWidgetSecurityHeaders(['*'], origin) }
    )
  }

  const headers = getWidgetSecurityHeaders(verification.payload.allowedDomains, origin)

  return NextResponse.json(
    {
      businessId: verification.payload.businessId,
      config: defaultWidgetConfig,
      permissions: verification.payload.permissions || ['read', 'write', 'display'],
    },
    { headers }
  )
}
