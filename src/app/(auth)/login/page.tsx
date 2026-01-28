'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-warm-white mb-6">
          Welcome back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="text-sm text-status-error">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-vault-gray/60" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-vault-dark text-vault-muted">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <Mail className="w-4 h-4 mr-2" />
          Google
        </Button>

        <p className="mt-6 text-center text-sm text-vault-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
