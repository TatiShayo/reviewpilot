'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type AuthFormData = z.infer<typeof authSchema>

export function LoginForm() {
  return <AuthForm mode="login" />
}

export function SignupForm() {
  return <AuthForm mode="signup" />
}

function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  })

  async function onSubmit(data: AuthFormData) {
    setLoading(true)
    const supabase = createClient()

    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email: data.email,
            password: data.password,
          })
        : await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      toast.success('Check your email for a confirmation link.')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Sign in to manage your reviews.'
            : 'Start responding to reviews in one click.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" loading={loading} className="w-full">
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <a href="/signup" className="underline hover:text-foreground">
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a href="/login" className="underline hover:text-foreground">
                  Sign in
                </a>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
