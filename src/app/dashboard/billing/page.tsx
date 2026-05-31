'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FREE_LIMIT = 50

interface SubscriptionInfo {
  status: string
  currentPeriodEnd: string | null
}

interface ProfileInfo {
  tier: string
  responsesUsed: number
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [profile, setProfile] = useState<ProfileInfo>({ tier: 'free', responsesUsed: 0 })
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Subscription activated! Welcome to ReviewPilot.')
    } else if (searchParams.get('checkout') === 'cancelled') {
      toast.error('Checkout was cancelled.')
    }
  }, [searchParams])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle()

        setSub(subData ? {
          status: subData.status,
          currentPeriodEnd: subData.current_period_end,
        } : null)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier, responses_used_this_month')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            tier: profileData.subscription_tier || 'free',
            responsesUsed: profileData.responses_used_this_month || 0,
          })
        }
      } catch {
        // defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCheckout = useCallback(async (tier: 'pro' | 'business') => {
    setCheckoutLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }, [])

  const handlePortal = useCallback(async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }, [])

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'
  const used = profile.responsesUsed
  const limit = FREE_LIMIT
  const pct = Math.min(100, Math.round((used / limit) * 100))

  if (loading) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
      <h2 className="text-2xl font-bold">Billing</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Current Plan
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Free'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isActive && sub?.currentPeriodEnd
              ? `Next billing date: ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
              : 'Free tier — 50 responses per month'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Responses used this month</span>
              <span className="text-sm text-muted-foreground">
                {used}{profile.tier === 'free' ? ` / ${limit}` : ''}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isActive ? 'bg-[#f97316]' : pct > 80 ? 'bg-destructive' : 'bg-[#f97316]'
                }`}
                style={{ width: `${isActive ? 100 : pct}%` }}
              />
            </div>
          </div>

          {isActive && (
            <Button variant="outline" onClick={handlePortal} loading={portalLoading}>
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          )}
        </CardContent>
      </Card>

      {!isActive && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className={profile.tier === 'pro' ? 'border-[#f97316]' : ''}>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">$15</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li>✓ Unlimited AI responses</li>
                <li>✓ Multi-location management</li>
                <li>✓ Sentiment analysis</li>
                <li>✓ Custom response templates</li>
                <li>✓ Auto-responder</li>
              </ul>
              <Button
                className="w-full"
                onClick={() => handleCheckout('pro')}
                loading={checkoutLoading === 'pro'}
              >
                {checkoutLoading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">$29</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li>✓ Everything in Pro</li>
                <li>✓ White-label responses</li>
                <li>✓ Priority support</li>
                <li>✓ Team access (coming soon)</li>
                <li>✓ API access (coming soon)</li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCheckout('business')}
                loading={checkoutLoading === 'business'}
              >
                {checkoutLoading === 'business' ? 'Redirecting...' : 'Upgrade to Business'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
