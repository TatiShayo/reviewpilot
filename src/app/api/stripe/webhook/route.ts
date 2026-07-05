import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function setSubscriptionTier(userId: string, tier: string) {
  const supabaseAdmin = getSupabaseAdmin()
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId)
}

async function resetUsage(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  await supabaseAdmin
    .from('profiles')
    .update({ responses_used_this_month: 0 })
    .eq('id', userId)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const tier = session.metadata?.tier || 'pro'

        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const subAny = sub as any
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: sub.items.data[0]?.price.id,
              status: sub.status,
              current_period_start: new Date(subAny.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subAny.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
            })

          await setSubscriptionTier(userId, tier)
          await resetUsage(userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: existing } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (existing) {
          const subAny = sub as any
          await supabaseAdmin
            .from('subscriptions')
            .update({
              stripe_subscription_id: sub.id,
              stripe_price_id: sub.items.data[0]?.price.id,
              status: sub.status,
              current_period_start: new Date(subAny.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subAny.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
            })
            .eq('stripe_customer_id', customerId)

          if (sub.status === 'active' || sub.status === 'trialing') {
            const amount = sub.items.data[0]?.price.unit_amount
            const tier = amount === 2900 ? 'business' : 'pro'
            await setSubscriptionTier(existing.user_id, tier)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: existing } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (existing) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled', stripe_subscription_id: null })
            .eq('stripe_customer_id', customerId)

          await setSubscriptionTier(existing.user_id, 'free')
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (sub) {
          await resetUsage(sub.user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
