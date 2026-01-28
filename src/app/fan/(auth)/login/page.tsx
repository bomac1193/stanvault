'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Music, Loader2, Eye, EyeOff } from 'lucide-react'

export default function FanLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/fan/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      router.push(data.redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gold/10 rounded-xl mb-4">
            <Music className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-warm-white">Fan Portal</h1>
          <p className="text-vault-muted mt-1">Sign in to your fan identity</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-vault-dark border border-vault-gray rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error rounded-lg text-status-error text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-warm-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:border-gold"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-warm-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:border-gold pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-warm-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gold text-vault-black font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-vault-muted mt-6">
          Don't have an account?{' '}
          <Link href="/fan/register" className="text-gold hover:underline">
            Create one
          </Link>
        </p>

        {/* Artist link */}
        <p className="text-center text-vault-muted mt-4 text-sm">
          Are you an artist?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Artist login
          </Link>
        </p>
      </div>
    </div>
  )
}
