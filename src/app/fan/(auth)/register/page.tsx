'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Music, Loader2, Eye, EyeOff, Check } from 'lucide-react'

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
    { met: password.length >= 6, text: 'At least 6 characters' },
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
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gold/10 rounded-xl mb-4">
            <Music className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-warm-white">Create Fan Account</h1>
          <p className="text-vault-muted mt-1">Own your fan identity</p>
        </div>

        {/* Value props */}
        <div className="bg-vault-darker border border-vault-gray rounded-lg p-4 mb-6">
          <p className="text-sm text-vault-muted mb-3">With a Stanvault fan account, you can:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-warm-white">
              <Check className="w-4 h-4 text-gold" />
              Prove your fandom to get presale access & perks
            </li>
            <li className="flex items-center gap-2 text-warm-white">
              <Check className="w-4 h-4 text-gold" />
              See your status with all your favorite artists
            </li>
            <li className="flex items-center gap-2 text-warm-white">
              <Check className="w-4 h-4 text-gold" />
              Own your fan data - portable and verifiable
            </li>
          </ul>
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
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:border-gold"
              placeholder="How artists will see you"
            />
          </div>

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

          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-warm-white mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {/* Password requirements */}
          <div className="mb-6 space-y-1">
            {passwordRequirements.map((req, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs ${
                  req.met ? 'text-status-success' : 'text-vault-muted'
                }`}
              >
                <Check className={`w-3 h-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                {req.text}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordRequirements.every(r => r.met)}
            className="w-full py-3 bg-gold text-vault-black font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-vault-muted mt-6">
          Already have an account?{' '}
          <Link href="/fan/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
