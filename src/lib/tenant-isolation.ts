/**
 * Tenant Isolation & Authorization Guard
 * Enforces multi-tenant data boundaries, prevents IDOR/BOLA attacks,
 * and validates tenant ownership across all operations.
 */

export class TenantAccessDeniedError extends Error {
  public statusCode: number
  public resource: string

  constructor(resource = 'Resource', message?: string) {
    super(message || `Access denied: Cross-tenant access attempted on ${resource}.`)
    this.name = 'TenantAccessDeniedError'
    this.statusCode = 403
    this.resource = resource
  }
}

export class AuthenticationRequiredError extends Error {
  public statusCode: number

  constructor(message = 'Authentication required.') {
    super(message)
    this.name = 'AuthenticationRequiredError'
    this.statusCode = 401
  }
}

/**
 * Validates that the active user/tenant matches the owner of the requested resource.
 */
export function validateTenantAccess(
  resourceOwnerId: string | null | undefined,
  currentUserId: string | null | undefined
): boolean {
  if (!resourceOwnerId || !currentUserId) {
    return false
  }
  return resourceOwnerId.trim() === currentUserId.trim()
}

/**
 * Asserts that the active user owns the target resource; throws TenantAccessDeniedError otherwise.
 */
export function assertTenantOwnership(
  resourceOwnerId: string | null | undefined,
  currentUserId: string | null | undefined,
  resourceName = 'Resource'
): void {
  if (!currentUserId) {
    throw new AuthenticationRequiredError()
  }

  if (!validateTenantAccess(resourceOwnerId, currentUserId)) {
    throw new TenantAccessDeniedError(
      resourceName,
      `Forbidden: You do not have permission to access or modify this ${resourceName}.`
    )
  }
}

export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/**
 * Checks if a user's role satisfies minimum required permissions.
 */
export function hasMinimumRole(userRole: TenantRole, requiredRole: TenantRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Scopes a list of entities to only those belonging to the authenticated tenant.
 */
export function filterForTenant<T extends { user_id?: string; userId?: string }>(
  items: T[],
  currentUserId: string
): T[] {
  if (!items || !Array.isArray(items) || !currentUserId) return []
  return items.filter(
    (item) => (item.user_id && item.user_id === currentUserId) || (item.userId && item.userId === currentUserId)
  )
}
