'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created. Please sign in.')
      } else {
        router.push('/onboarding')
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/onboarding' })
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-medium text-white" style={{ fontFamily: 'Canela, serif' }}>
          See who&apos;s real.
        </h1>
        <p className="text-body-sm text-gray-500 font-light mt-2">
          Conviction over vanity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
        />

        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 text-body-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Enter'}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-black text-caption text-gray-600 uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full px-6 py-3 text-body-sm font-medium text-white border border-gray-700 hover:border-gray-500 transition-colors duration-300"
      >
        Continue with Google
      </button>

      <div className="mt-12 space-y-8 text-center">
        <div>
          <p className="text-caption text-gray-600 mb-2">Already in?</p>
          <Link href="/login" className="text-body-sm text-white hover:text-accent transition-colors duration-300">
            Sign in
          </Link>
        </div>
        <div>
          <p className="text-caption text-gray-600 mb-2">Are you a fan?</p>
          <Link href="/fan/register" className="text-body-sm text-gray-400 hover:text-white transition-colors duration-300">
            Fan registration →
          </Link>
        </div>
      </div>
    </div>
  )
}
