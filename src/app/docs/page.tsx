import { PRODUCT_NAME } from '@/lib/labels'

export const metadata = {
  title: `API Docs — ${PRODUCT_NAME}`,
  description: `${PRODUCT_NAME} API documentation for B2B integrations`,
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-medium mb-2" style={{ fontFamily: 'Canela, serif' }}>{PRODUCT_NAME} API</h1>
        <p className="text-gray-400 mb-12">
          Endpoints for querying fan intelligence, importing fans, and verifying tier status.
          All requests require the <code className="text-accent">X-Ecosystem-Secret</code> header.
        </p>

        {/* Core Fans */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-gray-400 mb-1">Core Fans</h2>
          <p className="text-sm text-gray-500 mb-4">
            Retrieve fans above a score or tier threshold.
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded p-4 text-sm font-mono mb-4">
            <span className="text-status-success">GET</span>{' '}
            <span className="text-gray-300">/api/imprint/core-fans</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Query Parameters</h3>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-4">Param</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">artistName</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Creator name (required if no artistId)</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">artistId</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Creator ID (required if no artistName)</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">minStanScore</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Minimum Pulse score (default: 70)</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">minTier</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">CASUAL | ENGAGED | DEDICATED | SUPERFAN</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-accent">limit</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Max results (default: 200, max: 1000)</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-sm font-medium text-gray-400 mb-2">Example Response</h3>
          <pre className="bg-gray-900 border border-gray-800 rounded p-4 text-xs text-gray-300 overflow-x-auto">
{`{
  "artist": { "id": "...", "name": "Ada Eze" },
  "segment": { "minTier": "SUPERFAN", "count": 42 },
  "superfans": [
    {
      "fanId": "...",
      "displayName": "Chidi O.",
      "stanScore": 87,
      "tier": "SUPERFAN",
      "convictionScore": 28,
      "city": "Lagos",
      "lastActiveAt": "2026-02-28T..."
    }
  ]
}`}
          </pre>
        </section>

        {/* Fan Import */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-gray-400 mb-1">Fan Import</h2>
          <p className="text-sm text-gray-500 mb-4">
            Import a fan from an external platform (e.g., Oryx/Dasham conviction data).
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded p-4 text-sm font-mono mb-4">
            <span className="text-yellow-400">POST</span>{' '}
            <span className="text-gray-300">/api/imprint/fan/import</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Request Body</h3>
          <pre className="bg-gray-900 border border-gray-800 rounded p-4 text-xs text-gray-300 overflow-x-auto">
{`{
  "fan_id": "string",
  "artist_id": "string",
  "conviction_score": 72,
  "platforms": [
    {
      "platform": "boomplay",
      "streams": 1500,
      "saves": 40,
      "shares": 12
    }
  ],
  "region": "lagos",
  "tips_sent": 3
}`}
          </pre>
        </section>

        {/* Tier Query */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-gray-400 mb-1">Tier Query</h2>
          <p className="text-sm text-gray-500 mb-4">
            Query tier distribution or look up a specific fan&apos;s tier.
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded p-4 text-sm font-mono mb-4">
            <span className="text-status-success">GET</span>{' '}
            <span className="text-gray-300">/api/imprint/tier?artistName=Ada+Eze</span>
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Query Parameters</h3>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-4">Param</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">artistName</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Creator name (required)</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-accent">fanEmail</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Look up specific fan by email (optional)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-accent">fanId</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Look up specific fan by ID (optional)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Verify */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-gray-400 mb-1">Verify Fan</h2>
          <p className="text-sm text-gray-500 mb-4">
            Verify a fan&apos;s identity and tier for gated access (ticket presales, merch drops, etc.).
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded p-4 text-sm font-mono mb-4">
            <span className="text-status-success">GET</span>{' '}
            <span className="text-gray-300">/api/verify/ticket?token=...</span>
          </div>
          <p className="text-xs text-gray-500">
            Fan verification tokens are generated via the fan portal and expire after 5 minutes.
          </p>
        </section>

        {/* Authentication */}
        <section className="mb-12 border-t border-gray-800 pt-12">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Authentication</h2>
          <p className="text-sm text-gray-400 mb-4">
            All API endpoints require the ecosystem secret header:
          </p>
          <pre className="bg-gray-900 border border-gray-800 rounded p-4 text-xs text-gray-300">
{`curl -H "X-Ecosystem-Secret: your_secret" \\
     "https://your-domain/api/imprint/core-fans?artistName=Ada+Eze"`}
          </pre>
        </section>

        <footer className="border-t border-gray-800 pt-8 text-center">
          <p className="text-xs text-gray-600">
            {PRODUCT_NAME} API v1 &mdash; Fan Intelligence Infrastructure
          </p>
        </footer>
      </div>
    </main>
  )
}
