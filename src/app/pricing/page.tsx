 'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  CURRENCY_LOCALES,
  detectCurrencyFromLocale as detectCurrencyFromLocaleShared,
  FX_RATES_USD_BASE,
  ORYX_CORE_MARKETS,
  type MarketCurrency,
} from 'market-core'

type CurrencyCode = MarketCurrency
type CurrencyMode = 'AUTO' | CurrencyCode

function detectCurrencyFromLocale(): CurrencyCode {
  if (typeof navigator === 'undefined') return 'USD'
  return detectCurrencyFromLocaleShared(navigator.language || 'en-US')
}

function formatAmount(currency: CurrencyCode, amountUsd: number): string {
  const converted = amountUsd * FX_RATES_USD_BASE[currency]
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(converted)
}

const tiers = [
  {
    name: 'Starter',
    amountUsd: 29,
    fit: 'Independent and experimental artists',
    includes: [
      'Fan intelligence core (up to 200 fans)',
      'Pulse Score + tier analytics',
      'Up to 5 drops',
      'Spotify fan discovery',
      'Basic segmentation',
    ],
  },
  {
    name: 'Private Circle',
    amountUsd: 1500,
    fit: 'Focused independent teams',
    includes: [
      'Imprint fan intelligence core',
      'Advanced segmentation and tier analytics',
      'Campaign workspace with variable presets',
      'Echoniq live delivery (up to 15k sends/month)',
      'Structured onboarding support',
    ],
  },
  {
    name: 'Patron Growth',
    amountUsd: 4000,
    fit: 'Scaling artist operations',
    includes: [
      'Everything in Private Circle',
      'Higher-volume delivery (up to 75k sends/month)',
      'Priority routing and deliverability monitoring',
      'Campaign history, presets, and advanced personalization',
      'Monthly strategy review',
    ],
    featured: true,
  },
  {
    name: 'Sovereign',
    amountUsd: 10000,
    plus: true,
    fit: 'Enterprise artist portfolios',
    includes: [
      'Everything in Patron Growth',
      'Custom orchestration and API workflows',
      'High-volume/priority infrastructure',
      'Dedicated success lead',
      'Custom SLAs and strategic advisory',
    ],
  },
]

const matrix = [
  ['Imprint scoring + fan tiers', 'Yes', 'Yes', 'Yes', 'Yes'],
  ['Live Echoniq campaigns', '500/mo', 'Included', 'Included', 'Included'],
  ['Variable presets + smart mapping', 'Basic', 'Yes', 'Yes', 'Yes'],
  ['Monthly live send allowance', '500', '15k', '75k', 'Custom'],
  ['Voice campaigns', 'No', 'Included', 'Included', 'Included'],
  ['Advanced orchestration', 'No', 'Limited', 'Expanded', 'Custom'],
  ['Priority support', 'No', 'Standard', 'Priority', 'Dedicated'],
]

export default function PricingPage() {
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('AUTO')
  const [autoCurrency, setAutoCurrency] = useState<CurrencyCode>('USD')

  useEffect(() => {
    const detected = detectCurrencyFromLocale()
    setAutoCurrency(detected)

    const persisted = window.localStorage.getItem('im_currency_mode') as CurrencyMode | null
    if (
      persisted === 'AUTO' ||
      persisted === 'USD' ||
      persisted === 'GBP' ||
      persisted === 'EUR' ||
      persisted === 'NGN' ||
      persisted === 'ZAR' ||
      persisted === 'KES' ||
      persisted === 'GHS' ||
      persisted === 'UGX'
    ) {
      setCurrencyMode(persisted)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('im_currency_mode', currencyMode)
    }
  }, [currencyMode])

  const effectiveCurrency = useMemo<CurrencyCode>(
    () => (currencyMode === 'AUTO' ? autoCurrency : currencyMode),
    [currencyMode, autoCurrency]
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <p className="text-caption uppercase tracking-widest text-gray-500">Pricing</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold">Pricing for serious fan operations.</h1>
        <p className="mt-4 max-w-3xl text-gray-300">
          Stanvault handles intelligence. Echoniq handles activation. Choose the tier that matches
          campaign volume, operating requirements, and your primary fan market.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label htmlFor="currency-mode" className="text-caption uppercase tracking-widest text-gray-500">
            Currency
          </label>
          <select
            id="currency-mode"
            value={currencyMode}
            onChange={(e) => setCurrencyMode(e.target.value as CurrencyMode)}
            className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            <option value="AUTO">Auto ({autoCurrency})</option>
            <option disabled>──────── Oryx Core Markets ────────</option>
            {ORYX_CORE_MARKETS.map((market) => (
              <option key={market.currency} value={market.currency}>
                {market.label}
              </option>
            ))}
            <option disabled>──────── Global ────────</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
          <p className="text-caption text-gray-600">
            Display estimates in local currency. FX benchmarks use internal reference rates (February 2026) and final checkout currency can vary.
          </p>
        </div>
        <p className="mt-3 max-w-3xl text-caption text-gray-500">
          Oryx alignment: prioritize depth in specific markets instead of shallow global coverage.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-10 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={`border p-6 ${tier.featured ? 'border-accent bg-gray-950/70' : 'border-gray-800 bg-gray-950/40'}`}
          >
            <p className="text-caption uppercase tracking-widest text-gray-500">{tier.fit}</p>
            <h2 className="mt-2 text-2xl font-semibold">{tier.name}</h2>
            <p className="mt-3 text-3xl font-bold">
              {formatAmount(effectiveCurrency, tier.amountUsd)}
              {tier.plus ? '+' : ''}
              <span className="text-base text-gray-400 font-medium">/mo</span>
            </p>
            <ul className="mt-5 space-y-2 text-gray-300">
              {tier.includes.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-block px-5 py-2.5 bg-gray-900 text-gray-200 font-medium border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
            >
              Start Application
            </Link>
          </article>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <p className="mb-4 text-caption uppercase tracking-widest text-gray-500">Tier Comparison</p>
        <div className="border border-gray-800 overflow-auto">
          <table className="w-full min-w-[720px] text-left table-fixed">
            <thead className="bg-gray-900/70">
              <tr>
                <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/4">What You Get</th>
                <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-[15%]">Starter</th>
                <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/5">Private Circle</th>
                <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/5">Patron Growth</th>
                <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/5">Sovereign</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row[0]} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-gray-200 break-words">{row[0]}</td>
                  <td className="px-4 py-3 text-gray-300 break-words">{row[1]}</td>
                  <td className="px-4 py-3 text-gray-300 break-words">{row[2]}</td>
                  <td className="px-4 py-3 text-gray-300 break-words">{row[3]}</td>
                  <td className="px-4 py-3 text-gray-300 break-words">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-900 text-gray-200 font-medium border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
          >
            Apply Now
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-700 hover:border-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
