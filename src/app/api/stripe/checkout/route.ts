import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

let stripeClient: Stripe | null = null

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeClient = new Stripe(key, {
      apiVersion: '2026-05-27.dahlia',
    })
  }
  return stripeClient
}

const PLAN_CONFIG: Record<string, { name: string; description: string; amount: number }> = {
  pro: {
    name: 'ReviewPilot Pro',
    description: 'Unlimited AI responses, multi-location management',
    amount: 1500,
  },
  business: {
    name: 'ReviewPilot Business',
    description: 'Everything in Pro plus white-label & priority support',
    amount: 2900,
  },
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const tier = (body.tier === 'business' ? 'business' : 'pro') as 'pro' | 'business'
    const plan = PLAN_CONFIG[tier]

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'inactive',
      })
    }

    if (sub?.stripe_subscription_id && (sub.status === 'active' || sub.status === 'trialing')) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.nextUrl.origin}/dashboard/billing`,
      })
      return NextResponse.json({ url: session.url })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/dashboard/billing?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/dashboard/billing?checkout=cancelled`,
      metadata: { user_id: user.id, tier },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
