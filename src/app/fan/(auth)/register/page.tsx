'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

export default function FanRegisterPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordRequirements = [
    { met: password.length >= 6, text: '6+ characters' },
    { met: password === confirmPassword && password.length > 0, text: 'Passwords match' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/fan/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      router.push(data.redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-white">Create account</h1>
          <p className="text-body-sm text-gray-500 font-light mt-2">
            Own your <span className="text-accent">"fan"</span> identity
          </p>
        </div>

        {/* Value prop */}
        <div className="mb-8 p-4 border-l-2 border-l-accent bg-gray-900/30">
          <p className="text-caption text-gray-400 uppercase tracking-wider mb-2">Why join</p>
          <ul className="space-y-1 text-body-sm text-gray-300 font-light">
            <li>• Prove fandom for presales & perks</li>
            <li>• Portable, verifiable data you own</li>
            <li>• Direct connection to artists</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border-l-2 border-l-status-error bg-status-error/10 text-status-error text-caption">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
              className="w-full bg-transparent border-b border-gray-700 py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors"
              placeholder="How artists see you"
            />
          </div>

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

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-transparent border-b border-gray-700 py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Requirements */}
          <div className="flex gap-4">
            {passwordRequirements.map((req, i) => (
              <span
                key={i}
                className={`text-caption flex items-center gap-1 ${
                  req.met ? 'text-status-success' : 'text-gray-600'
                }`}
              >
                <Check className={`w-3 h-3 ${req.met ? '' : 'opacity-30'}`} />
                {req.text}
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordRequirements.every(r => r.met)}
            className="w-full py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Link */}
        <p className="mt-8 text-center text-body-sm text-gray-500">
          Have an account?{' '}
          <Link href="/fan/login" className="text-white hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
