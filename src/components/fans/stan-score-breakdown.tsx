import { Card, CardHeader, CardTitle, CardContent, ProgressRing } from '@/components/ui'

interface StanScoreBreakdownProps {
  platformScore: number
  engagementScore: number
  longevityScore: number
  recencyScore: number
  totalScore: number
}

export function StanScoreBreakdown({
  platformScore,
  engagementScore,
  longevityScore,
  recencyScore,
  totalScore,
}: StanScoreBreakdownProps) {
  const scores = [
    { label: 'Platform', value: platformScore, max: 30, description: 'Multi-platform presence' },
    { label: 'Engagement', value: engagementScore, max: 40, description: 'Interaction depth' },
    { label: 'Longevity', value: longevityScore, max: 20, description: 'Time as a fan' },
    { label: 'Recency', value: recencyScore, max: 10, description: 'Recent activity' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stan Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <ProgressRing
            value={totalScore}
            max={100}
            size={120}
            strokeWidth={8}
            showValue
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {scores.map((score) => (
            <div key={score.label} className="flex flex-col items-center">
              <ProgressRing
                value={score.value}
                max={score.max}
                size={70}
                strokeWidth={5}
                showValue
              />
              <p className="mt-2 text-sm font-medium text-warm-white">{score.label}</p>
              <p className="text-xs text-vault-muted text-center">{score.description}</p>
              <p className="text-xs text-vault-muted">
                {score.value}/{score.max} pts
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
