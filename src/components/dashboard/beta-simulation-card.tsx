import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

interface SimulationSummary {
  totalParticipants: number
  icpCount: number
  nonCustomerCount: number
  haterCount: number
  coreAudienceCount: number
  expansionCount: number
  thesis: string
  recommendedRollout: string[]
  regionBreakdown: Array<{
    region: string
    icpCount: number
    avgFit: number
    coreCount: number
    verdict: string
  }>
  apiPriorities: {
    connect: string[]
    reach: string[]
    rails: string[]
  }
  blindspots: string[]
}

interface BetaSimulationCardProps {
  summary: SimulationSummary
}

export function BetaSimulationCard({ summary }: BetaSimulationCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Beta Stress Test</CardTitle>
        <CardDescription>
          {summary.icpCount} ICPs, {summary.nonCustomerCount} non-customers, and {summary.haterCount} haters.
          Tier bands in this preview represent market-fit strength, not real fan tiers.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-[#1a1a1a] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Profiles</p>
            <p className="text-2xl text-white mt-2">{summary.totalParticipants}</p>
          </div>
          <div className="border border-[#1a1a1a] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Core Now</p>
            <p className="text-2xl text-white mt-2">{summary.coreAudienceCount}</p>
          </div>
          <div className="border border-[#1a1a1a] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Expand Next</p>
            <p className="text-2xl text-white mt-2">{summary.expansionCount}</p>
          </div>
          <div className="border border-[#1a1a1a] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Stress Noise</p>
            <p className="text-2xl text-white mt-2">{summary.nonCustomerCount + summary.haterCount}</p>
          </div>
        </div>

        <div className="border border-[#1a1a1a] p-4">
          <p className="text-sm text-gray-300">{summary.thesis}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Regional Fit</p>
            <div className="space-y-3">
              {summary.regionBreakdown.map((region) => (
                <div key={region.region} className="border border-[#1a1a1a] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-white">{region.region}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                      {region.verdict}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-sm text-gray-400">
                    <span>{region.icpCount} ICPs</span>
                    <span>{region.coreCount} core</span>
                    <span>{region.avgFit} avg fit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Rollout Order</p>
              <div className="space-y-2">
                {summary.recommendedRollout.map((item) => (
                  <div key={item} className="border border-[#1a1a1a] px-4 py-3 text-sm text-gray-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-[#1a1a1a] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-3">Connect</p>
                <div className="space-y-2 text-sm text-gray-300">
                  {summary.apiPriorities.connect.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="border border-[#1a1a1a] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-3">Reach</p>
                <div className="space-y-2 text-sm text-gray-300">
                  {summary.apiPriorities.reach.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="border border-[#1a1a1a] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-3">Oryx Rails</p>
                <div className="space-y-2 text-sm text-gray-300">
                  {summary.apiPriorities.rails.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Blind Spots</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.blindspots.map((item) => (
              <div key={item} className="border border-[#1a1a1a] px-4 py-3 text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
