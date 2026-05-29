import { Suspense } from 'react'
import { LoginForm } from '@/components/auth-form'

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
