import { describe, it, expect } from 'vitest'
import {
  validateTenantAccess,
  assertTenantOwnership,
  hasMinimumRole,
  filterForTenant,
  TenantAccessDeniedError,
  AuthenticationRequiredError,
} from '@/lib/tenant-isolation'

describe('Tenant Isolation & RLS Access Control Suite', () => {
  describe('validateTenantAccess', () => {
    it('returns true when resource owner matches active user', () => {
      expect(validateTenantAccess('user-123', 'user-123')).toBe(true)
    })

    it('returns false when resource owner belongs to another tenant', () => {
      expect(validateTenantAccess('user-123', 'user-456')).toBe(false)
    })

    it('returns false when either ID is missing or null', () => {
      expect(validateTenantAccess(null, 'user-123')).toBe(false)
      expect(validateTenantAccess('user-123', null)).toBe(false)
      expect(validateTenantAccess(undefined, undefined)).toBe(false)
    })
  })

  describe('assertTenantOwnership (IDOR Prevention Guard)', () => {
    it('does not throw when tenant ownership is valid', () => {
      expect(() => {
        assertTenantOwnership('tenant-abc', 'tenant-abc', 'Business')
      }).not.toThrow()
    })

    it('throws TenantAccessDeniedError with 403 when cross-tenant access is attempted', () => {
      expect(() => {
        assertTenantOwnership('tenant-victim', 'tenant-attacker', 'Business')
      }).toThrow(TenantAccessDeniedError)

      try {
        assertTenantOwnership('tenant-victim', 'tenant-attacker', 'Review')
      } catch (err: unknown) {
        const error = err as TenantAccessDeniedError
        expect(error.statusCode).toBe(403)
        expect(error.resource).toBe('Review')
      }
    })

    it('throws AuthenticationRequiredError with 401 when user is unauthenticated', () => {
      expect(() => {
        assertTenantOwnership('tenant-abc', null, 'Template')
      }).toThrow(AuthenticationRequiredError)
    })
  })

  describe('hasMinimumRole (RBAC)', () => {
    it('correctly evaluates role hierarchy: owner > admin > member > viewer', () => {
      expect(hasMinimumRole('owner', 'admin')).toBe(true)
      expect(hasMinimumRole('admin', 'member')).toBe(true)
      expect(hasMinimumRole('member', 'viewer')).toBe(true)

      // Viewer cannot perform admin actions
      expect(hasMinimumRole('viewer', 'admin')).toBe(false)
      expect(hasMinimumRole('member', 'owner')).toBe(false)
    })
  })

  describe('filterForTenant', () => {
    it('strictly isolates tenant rows and strips cross-tenant entities', () => {
      const records = [
        { id: 'b1', user_id: 'tenant-1', name: 'Biz 1' },
        { id: 'b2', user_id: 'tenant-2', name: 'Biz 2' },
        { id: 'b3', user_id: 'tenant-1', name: 'Biz 3' },
      ]

      const tenant1Records = filterForTenant(records, 'tenant-1')
      expect(tenant1Records.length).toBe(2)
      expect(tenant1Records.map((r) => r.id)).toEqual(['b1', 'b3'])

      const tenant2Records = filterForTenant(records, 'tenant-2')
      expect(tenant2Records.length).toBe(1)
      expect(tenant2Records[0].id).toBe('b2')
    })

    it('returns empty array when user has no matching records or user ID is empty', () => {
      const records = [{ id: 'b1', user_id: 'tenant-1' }]
      expect(filterForTenant(records, 'tenant-other')).toEqual([])
      expect(filterForTenant(records, '')).toEqual([])
    })
  })
})
