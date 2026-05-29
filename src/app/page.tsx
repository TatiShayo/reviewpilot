import { ButtonLink } from '@/components/ui/button'
import { MessageSquare, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex-1">
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
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              GPT-4o generates professional, friendly, or brief responses in seconds.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">One-Click Approve</h3>
            <p className="text-sm text-muted-foreground">
              Review, approve, and post — all without leaving the dashboard.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">$15/month</h3>
            <p className="text-sm text-muted-foreground">
              Unlimited responses. Kill your $299/mo Birdeye subscription.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
