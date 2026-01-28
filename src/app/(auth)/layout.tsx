import { Logo } from '@/components/brand/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <p className="font-display font-medium text-sm uppercase tracking-brand text-vault-muted mt-4">
            Own Your Fans. Own Your Future.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
