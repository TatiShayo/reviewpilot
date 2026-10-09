import crypto from 'crypto'

export interface EmbedTokenPayload {
  businessId: string
  tenantId: string
  allowedDomains: string[] // e.g. ['example.com', '*.example.com', 'localhost']
  expiresAt: number // epoch timestamp in ms
  permissions?: ('read' | 'write' | 'display')[]
}

/**
 * Embed-token signing secret.
 *
 * Fails closed: with a known default anyone can mint a token for ANY tenant and
 * read their widget data.
 */
function getEmbedSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  const secret = process.env.EMBED_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EMBED_TOKEN_SECRET must be set in production — embed tokens would otherwise be forgeable"
    );
  }
  return "dev-only-embed-secret";
}

/**
 * Generates a signed embed token for widget embedding.
 */
export function generateWidgetEmbedToken(
  payload: Omit<EmbedTokenPayload, 'expiresAt'> & { expiresInMs?: number },
  secret?: string
): string {
  const activeSecret = getEmbedSecret(secret)
  const expiresInMs = payload.expiresInMs ?? 365 * 24 * 60 * 60 * 1000 // default 1 year
  const fullPayload: EmbedTokenPayload = {
    businessId: payload.businessId,
    tenantId: payload.tenantId,
    allowedDomains: payload.allowedDomains || ['*'],
    expiresAt: Date.now() + expiresInMs,
    permissions: payload.permissions || ['read', 'write', 'display'],
  }

  const encodedData = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', activeSecret)
    .update(encodedData)
    .digest('base64url')

  return `${encodedData}.${signature}`
}

/**
 * Checks if a given request origin matches the allowed domains list.
 */
export function isOriginAllowed(origin: string | null | undefined, allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0 || allowedDomains.includes('*')) {
    return true
  }

  if (!origin) {
    return false
  }

  let hostname = ''
  try {
    const url = new URL(origin.startsWith('http') ? origin : `https://${origin}`)
    hostname = url.hostname.toLowerCase()
  } catch {
    hostname = origin.toLowerCase()
  }

  for (const pattern of allowedDomains) {
    const cleanPattern = pattern.trim().toLowerCase().replace(/^https?:\/\//, '')
    if (cleanPattern === '*' || cleanPattern === hostname) {
      return true
    }

    if (cleanPattern.startsWith('*.')) {
      const rootDomain = cleanPattern.slice(2)
      if (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`)) {
        return true
      }
    }
  }

  return false
}

/**
 * Verifies a signed embed token and validates origin & expiration.
 */
export function verifyWidgetEmbedToken(
  token: string,
  requestOrigin?: string | null,
  secret?: string
): { valid: boolean; payload?: EmbedTokenPayload; error?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, error: 'Malformed or missing embed token' }
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token structure' }
  }

  const [encodedData, signature] = parts
  const activeSecret = getEmbedSecret(secret)

  // Constant-time HMAC comparison
  const expectedSignature = crypto
    .createHmac('sha256', activeSecret)
    .update(encodedData)
    .digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid token signature' }
  }

  let payload: EmbedTokenPayload
  try {
    const jsonStr = Buffer.from(encodedData, 'base64url').toString('utf8')
    payload = JSON.parse(jsonStr)
  } catch {
    return { valid: false, error: 'Failed to decode token payload' }
  }

  // Expiration check
  if (typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) {
    return { valid: false, error: 'Embed token has expired' }
  }

  // Domain / Origin check
  if (requestOrigin && !isOriginAllowed(requestOrigin, payload.allowedDomains)) {
    return { valid: false, error: `Origin '${requestOrigin}' not permitted by this embed token` }
  }

  return { valid: true, payload }
}

/**
 * Returns security headers for widget embedding and CORS.
 */
export function getWidgetSecurityHeaders(
  allowedDomains: string[] = ['*'],
  requestOrigin?: string | null
): Record<string, string> {
  const isWildcard = allowedDomains.includes('*')
  const allowedOriginHeader = isWildcard
    ? '*'
    : requestOrigin && isOriginAllowed(requestOrigin, allowedDomains)
    ? requestOrigin
    : allowedDomains[0] || '*'

  let frameAncestors = "'self'"
  if (isWildcard) {
    frameAncestors = '*'
  } else {
    const formatted = allowedDomains
      .map((d) => (d.startsWith('http') ? d : `https://${d}`))
      .join(' ')
    frameAncestors = `'self' ${formatted}`
  }

  return {
    'Access-Control-Allow-Origin': allowedOriginHeader,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ReviewPilot-Widget',
    'Content-Security-Policy': `frame-ancestors ${frameAncestors}; default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
}
