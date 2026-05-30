import { Suspense } from 'react'
import { SignupForm } from '@/components/auth-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense fallback={<Skeleton className="h-96 w-96 rounded-lg" />}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
