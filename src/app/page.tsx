import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

const plans = [
  {
    name: 'Private Circle',
    price: '$1,500/mo',
    fit: 'For focused independent teams',
    features: [
      'Fan intelligence dashboard',
      'Tier and score segmentation',
      'Campaign workspace',
      'Live delivery allocation',
    ],
  },
  {
    name: 'Patron Growth',
    price: '$4,000/mo',
    fit: 'For scaling artist operations',
    features: [
      'Expanded live delivery',
      'Advanced personalization variables',
      'Preset libraries and campaign history',
      'Priority routing',
    ],
  },
  {
    name: 'Sovereign',
    price: '$10,000+/mo',
    fit: 'For enterprise artist portfolios',
    features: [
      'Dedicated infrastructure',
      'Custom orchestration',
      'High-volume delivery',
      'Strategic support',
    ],
  },
]

export default async function Home() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <p className="text-caption uppercase tracking-widest text-gray-500">
          Stanvault x Echoniq
        </p>
        <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight">
          Fan relationship infrastructure for artist-led businesses.
        </h1>
        <p className="mt-6 max-w-3xl text-body text-gray-300">
          Stanvault structures fan intelligence. Echoniq activates it through precise outreach.
          Built for teams that value long-term audience quality over short-term volume.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 border border-gray-700 text-white hover:border-white transition-colors"
          >
            View Pricing
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-700 text-white hover:border-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-6">
        <div className="border border-gray-800 p-6">
          <h2 className="text-xl font-semibold">Who This Is For</h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>Artists building direct, durable fan revenue.</li>
            <li>Managers running repeatable retention and conversion workflows.</li>
            <li>Teams optimizing for audience quality and lifetime value.</li>
          </ul>
        </div>
        <div className="border border-gray-800 p-6">
          <h2 className="text-xl font-semibold">Who This Is Not For</h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>Teams focused only on top-of-funnel volume.</li>
            <li>One-off campaign operators without continuity.</li>
            <li>Businesses that do not need structured fan operations.</li>
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">Psychographic Profile</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="border border-gray-800 p-5">
            <p className="text-caption uppercase tracking-widest text-gray-500">Identity</p>
            <p className="mt-2 text-gray-200">
              Disciplined operators, selective about access and positioning.
            </p>
          </div>
          <div className="border border-gray-800 p-5">
            <p className="text-caption uppercase tracking-widest text-gray-500">Motivation</p>
            <p className="mt-2 text-gray-200">
              Durable fan equity and measurable recurring revenue.
            </p>
          </div>
          <div className="border border-gray-800 p-5">
            <p className="text-caption uppercase tracking-widest text-gray-500">Behavior</p>
            <p className="mt-2 text-gray-200">
              Invests in systems, measures by conversion and retention.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">Pricing</h2>
        <p className="mt-2 text-gray-400">
          Clear tiers for teams with increasing operational depth.
        </p>
        <div className="mt-6 grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <article key={plan.name} className="border border-gray-800 p-6 bg-gray-950/40">
              <p className="text-caption uppercase tracking-widest text-gray-500">{plan.fit}</p>
              <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-gray-300 text-body-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="border border-gray-800 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Build a disciplined fan system.</h2>
            <p className="mt-2 text-gray-400">
              Start with segmentation. Scale activation as your operation matures.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-gray-700 hover:border-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-700 hover:border-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
