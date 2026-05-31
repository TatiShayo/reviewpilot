import { ButtonLink } from '@/components/ui/button'
import { MessageSquare, Zap, Shield, Check, X, ChevronDown } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Respond to every review in one click.
          <br />
          <span className="text-primary">Sound human every time.</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          53% of customers expect responses within 7 days. ReviewPilot connects your
          Google My Business and auto-generates AI replies — approve and post instantly.
        </p>
        <div className="flex gap-4">
          <ButtonLink size="lg" href="/signup">Start free — no card required</ButtonLink>
          <ButtonLink size="lg" variant="outline" href="/login">Sign in</ButtonLink>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              GPT-4o generates professional, friendly, or brief responses in seconds.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">One-Click Approve</h3>
            <p className="text-sm text-muted-foreground">
              Review, approve, and post — all without leaving the dashboard.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Multi-Location</h3>
            <p className="text-sm text-muted-foreground">
              Manage reviews across all your GMB locations from a single dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Birdeye Comparison */}
      <section className="bg-muted/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold">
            ReviewPilot vs Birdeye
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Get everything you need at 1/20th the price.
          </p>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-4 pr-4 font-semibold">Feature</th>
                  <th className="py-4 px-4 font-semibold text-primary">ReviewPilot</th>
                  <th className="py-4 pl-4 font-semibold text-muted-foreground">Birdeye</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: 'Price', rp: '$15/month', be: '$299/month' },
                  { feature: 'AI response generation', rp: true, be: true },
                  { feature: 'Multi-location support', rp: true, be: true },
                  { feature: 'Review monitoring', rp: true, be: true },
                  { feature: 'Sentiment analysis', rp: true, be: true },
                  { feature: 'Custom response templates', rp: true, be: true },
                  { feature: 'No long-term contract', rp: true, be: false },
                  { feature: '14-day free trial', rp: true, be: false },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4">{row.feature}</td>
                    <td className="py-3 px-4 text-primary">
                      {typeof row.rp === 'boolean' ? (
                        row.rp ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />
                      ) : (
                        row.rp
                      )}
                    </td>
                    <td className="py-3 pl-4 text-muted-foreground">
                      {typeof row.be === 'boolean' ? (
                        row.be ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />
                      ) : (
                        row.be
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">
            One plan. Unlimited responses. No surprises.
          </p>
          <div className="mt-12 mx-auto max-w-sm rounded-lg border p-8">
            <h3 className="text-xl font-semibold">Pro</h3>
            <div className="mt-4">
              <span className="text-5xl font-bold">$15</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-left text-sm">
              {[
                'Unlimited AI-generated responses',
                'Multi-location management',
                'Sentiment analysis',
                'Custom response templates',
                'Auto-responder',
                'Email support',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink href="/signup" className="mt-8 w-full" size="lg">
              Start free trial
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/50 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-12 space-y-4">
            {[
              {
                q: 'How does ReviewPilot connect to Google My Business?',
                a: 'Currently you copy reviews into ReviewPilot. Full Google OAuth integration is coming soon — you will be able to connect your GMB account and auto-import reviews.',
              },
              {
                q: 'Can I customize the AI response tone?',
                a: 'Yes. Each response is generated in three tones — professional, friendly, and brief. You can also set a custom tone preference and signature in your business settings.',
              },
              {
                q: 'How does the auto-responder work?',
                a: 'When enabled, ReviewPilot watches for new reviews and automatically generates AI responses. You can choose to auto-approve or manually review before posting.',
              },
              {
                q: 'Is there a limit on how many responses I can generate?',
                a: 'No. The Pro plan includes unlimited AI-generated responses for all your connected locations.',
              },
              {
                q: 'Do I need a credit card to start?',
                a: 'No. Start a 14-day free trial with no credit card required. Cancel anytime.',
              },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-lg border bg-background">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-4 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
