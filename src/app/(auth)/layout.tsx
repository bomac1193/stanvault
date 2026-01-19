export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-warm-white">
            Stan<span className="text-gold">vault</span>
          </h1>
          <p className="text-vault-muted mt-2">
            Know your fans. Build your legacy.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
