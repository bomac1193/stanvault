import { LogoMark } from '@/components/brand/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side — ambient presence */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 border-r border-gray-800 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[500px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative">
          <LogoMark size="lg" />
          <p className="text-caption uppercase tracking-[0.3em] text-gray-500 mt-3">
            Imprint
          </p>
        </div>
        <div className="relative max-w-sm">
          <p className="text-body font-light text-gray-400 leading-relaxed">
            Not all fans are equal.
          </p>
          <p className="text-caption text-gray-600 uppercase tracking-wider mt-2">
            Fan Intelligence
          </p>
        </div>
        <p className="relative text-caption text-gray-700 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Imprint
        </p>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden mb-12">
            <p className="text-caption uppercase tracking-[0.3em] text-gray-400 font-medium">
              Imprint
            </p>
            <p className="text-caption text-gray-600 font-light tracking-wide mt-1">
              Fan Intelligence
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
