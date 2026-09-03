'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'confirming' | 'unsubscribed' | 'error'>('loading')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No unsubscribe token provided.')
      return
    }

    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.email) {
          setEmail(data.email)
          setStatus('confirming')
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Invalid or expired unsubscribe link.')
        }
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg('Network error validating unsubscribe link.')
      })
  }, [token])

  async function handleConfirmUnsubscribe() {
    if (!token) return
    setStatus('loading')

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('unsubscribed')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Failed to complete unsubscribe request.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Failed to complete unsubscribe request.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="text-xl font-bold text-white">ReviewPilot</span>
        </div>

        {status === 'loading' && (
          <div className="py-8 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#f97316] border-t-transparent" />
            <p className="text-sm text-muted-foreground">Verifying unsubscribe token...</p>
          </div>
        )}

        {status === 'confirming' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Unsubscribe Confirmation</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to stop receiving review digest & notification emails for{' '}
              <strong className="text-white">{email}</strong>?
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleConfirmUnsubscribe}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Yes, Unsubscribe Me
              </button>
              <Link
                href="/"
                className="w-full border border-border hover:bg-muted text-muted-foreground hover:text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors block text-center"
              >
                Cancel and return to home
              </Link>
            </div>
          </div>
        )}

        {status === 'unsubscribed' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Successfully Unsubscribed</h2>
            <p className="text-sm text-muted-foreground">
              You will no longer receive emails from ReviewPilot. You can re-enable notifications at any time from your account settings.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm font-semibold text-[#f97316] hover:underline"
            >
              Return to ReviewPilot Home
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Unsubscribe Link Error</h2>
            <p className="text-sm text-red-400">{errorMsg}</p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm font-semibold text-[#f97316] hover:underline"
            >
              Return to ReviewPilot Home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
