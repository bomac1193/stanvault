'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <LogoMark size="lg" />
          <p className="text-caption text-gray-600 uppercase tracking-widest mt-3">
            Fan Portal
          </p>
        </div>

        {/* Form */}
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-white">Sign in</h1>
          <p className="text-body-sm text-gray-500 font-light mt-2">
            Access your fan identity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border-l-2 border-l-status-error bg-status-error/10 text-status-error text-caption">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b border-gray-700 py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-b border-gray-700 py-3 pr-10 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading</span>
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 space-y-4 text-center">
          <p className="text-body-sm text-gray-500">
            No account?{' '}
            <Link href="/fan/register" className="text-white hover:text-accent transition-colors">
              Create one
            </Link>
          </p>
          <p className="text-caption text-gray-600">
            Artist?{' '}
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Artist login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
