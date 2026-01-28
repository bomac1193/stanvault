import { StatementLogo, Tagline } from '@/components/brand/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Statement */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 border-r border-gray-800">
        <div>
          <StatementLogo />
        </div>
        <div className="max-w-md">
          <Tagline variant="full" />
        </div>
        <p className="text-caption text-gray-700 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Stanvault
        </p>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <p className="text-display-sm font-bold">
              <span className="text-accent">[</span>SV<span className="text-accent">]</span>
            </p>
            <p className="text-caption text-gray-500 uppercase tracking-widest mt-2">
              Stanvault
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
