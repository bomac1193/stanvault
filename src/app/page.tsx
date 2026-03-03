import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[800px] h-[600px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Brand */}
      <header className="relative max-w-5xl w-full mx-auto px-8 pt-12">
        <p className="text-2xl text-white" style={{ fontFamily: 'Canela, serif' }}>
          Imprint
        </p>
      </header>

      {/* Hero */}
      <section className="relative max-w-5xl w-full mx-auto px-8 pt-32 md:pt-44 pb-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
          Not all fans
          <br />
          are <span className="text-accent">equal</span>.
        </h1>
      </section>

      {/* Two doors */}
      <section className="relative max-w-5xl w-full mx-auto px-8 pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Creators & Teams */}
          <div className="group border border-gray-800 p-8 md:p-10 flex flex-col hover:border-gray-500 transition-all duration-500">
            <p className="text-caption uppercase tracking-widest text-gray-500">
              Creators & Teams
            </p>
            <h2 className="mt-5 text-2xl font-bold text-white leading-tight">
              See who&apos;s real.
            </h2>
            <p className="mt-3 text-body-sm text-gray-400 font-light leading-relaxed">
              Conviction over vanity. Tier intelligence that pierces the veil between casual listeners and real devotion.
            </p>
            <div className="mt-10 flex items-center gap-5">
              <Link href="/register" className="px-6 py-3 text-body-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors duration-300">
                Enter
              </Link>
              <Link href="/login" className="text-body-sm text-gray-500 hover:text-white transition-colors duration-300">
                Sign in
              </Link>
            </div>
          </div>

          {/* Fans */}
          <div className="group border border-accent/20 p-8 md:p-10 flex flex-col hover:border-accent/60 transition-all duration-500">
            <p className="text-caption uppercase tracking-widest text-accent/60">
              Fans
            </p>
            <h2 className="mt-5 text-2xl font-bold text-white leading-tight">
              Prove it.
            </h2>
            <p className="mt-3 text-body-sm text-gray-400 font-light leading-relaxed">
              10,000 streams. Every album. 6 shows. Still invisible.
              <br />
              Your devotion, unveiled.
            </p>
            <div className="mt-10 flex items-center gap-5">
              <Link href="/fan/register" className="px-6 py-3 text-body-sm font-medium text-black bg-accent hover:bg-accent-bright transition-colors duration-300">
                Enter
              </Link>
              <Link href="/fan/login" className="text-body-sm text-gray-500 hover:text-white transition-colors duration-300">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
