import { Suspense } from 'react'
import { SignupForm } from '@/components/auth-form'

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  )
}
