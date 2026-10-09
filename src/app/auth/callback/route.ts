import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validates the `next` redirect parameter to strictly prevent Open Redirect
 * attacks. Only relative internal paths beginning with `/` (and not `//`, `/\`,
 * or containing a protocol) are allowed; anything else falls back to
 * `/dashboard`. Mirrors postpilot's `getSafeRedirectPath`.
 */
export function getSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam) return '/dashboard'
  const trimmed = nextParam.trim()

  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('://') ||
    /[\x00-\x1F\x7F]/.test(trimmed)
  ) {
    return '/dashboard'
  }

  return trimmed
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
