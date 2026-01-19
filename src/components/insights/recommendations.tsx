import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Lightbulb, Users, TrendingUp, Target, Music } from 'lucide-react'

interface RecommendationsProps {
  totalFans: number
  superfanPercentage: number
  topCountry?: string
  connectedPlatforms: number
}

export function Recommendations({
  totalFans,
  superfanPercentage,
  topCountry,
  connectedPlatforms,
}: RecommendationsProps) {
  const recommendations = []

  if (connectedPlatforms < 3) {
    recommendations.push({
      icon: Music,
      title: 'Connect more platforms',
      description: `You've connected ${connectedPlatforms} platform${connectedPlatforms !== 1 ? 's' : ''}. Adding more helps identify cross-platform superfans.`,
    })
  }

  if (superfanPercentage < 5) {
    recommendations.push({
      icon: Target,
      title: 'Nurture your dedicated fans',
      description: `Only ${superfanPercentage}% of your fans are superfans. Focus on engaging your dedicated tier.`,
    })
  }

  if (superfanPercentage >= 10) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Great superfan ratio!',
      description: `${superfanPercentage}% superfan rate is excellent. Consider exclusive content for them.`,
    })
  }

  if (topCountry) {
    recommendations.push({
      icon: Users,
      title: `Strong in ${topCountry}`,
      description: `Consider touring or targeted marketing in ${topCountry} where most fans are.`,
    })
  }

  if (totalFans > 500) {
    recommendations.push({
      icon: Lightbulb,
      title: 'Growing fanbase',
      description: `With ${totalFans}+ fans tracked, consider email campaigns to convert engaged fans.`,
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: Lightbulb,
      title: 'Keep building',
      description: 'Connect platforms and engage with fans to unlock personalized insights.',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-vault-gray">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div key={index} className="px-6 py-4 flex items-start gap-4">
              <div className="p-2 bg-gold/10 rounded-lg">
                <rec.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="font-medium text-warm-white mb-1">{rec.title}</h4>
                <p className="text-sm text-vault-muted">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
