import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Music, Instagram, Youtube, Twitter, Mail, Play, Heart, MessageCircle, Share2, Eye, Clock } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface PlatformLink {
  platform: string
  streams?: number | null
  playlistAdds?: number | null
  saves?: number | null
  follows?: boolean | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  subscribed?: boolean | null
  videoViews?: number | null
  watchTime?: number | null
  emailOpens?: number | null
  emailClicks?: number | null
}

interface PlatformLinksListProps {
  platformLinks: PlatformLink[]
}

const platformConfig: Record<string, { icon: typeof Music; name: string }> = {
  SPOTIFY: { icon: Music, name: 'Spotify' },
  INSTAGRAM: { icon: Instagram, name: 'Instagram' },
  YOUTUBE: { icon: Youtube, name: 'YouTube' },
  TIKTOK: { icon: Music, name: 'TikTok' },
  TWITTER: { icon: Twitter, name: 'Twitter' },
  EMAIL: { icon: Mail, name: 'Email' },
}

function MetricItem({ icon: Icon, label, value }: { icon: typeof Play; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-500">{label}:</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

export function PlatformLinksList({ platformLinks }: PlatformLinksListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#1a1a1a]">
          {platformLinks.map((link) => {
            const config = platformConfig[link.platform]
            if (!config) return null

            const Icon = config.icon

            return (
              <div key={link.platform} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-white">{config.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pl-13">
                  {/* Spotify metrics */}
                  {link.streams !== null && link.streams !== undefined && (
                    <MetricItem icon={Play} label="Streams" value={formatNumber(link.streams)} />
                  )}
                  {link.playlistAdds !== null && link.playlistAdds !== undefined && (
                    <MetricItem icon={Music} label="Playlist Adds" value={link.playlistAdds} />
                  )}
                  {link.saves !== null && link.saves !== undefined && (
                    <MetricItem icon={Heart} label="Saves" value={link.saves} />
                  )}

                  {/* Social metrics */}
                  {link.follows !== null && link.follows !== undefined && (
                    <MetricItem icon={Heart} label="Following" value={link.follows ? 'Yes' : 'No'} />
                  )}
                  {link.likes !== null && link.likes !== undefined && (
                    <MetricItem icon={Heart} label="Likes" value={formatNumber(link.likes)} />
                  )}
                  {link.comments !== null && link.comments !== undefined && (
                    <MetricItem icon={MessageCircle} label="Comments" value={link.comments} />
                  )}
                  {link.shares !== null && link.shares !== undefined && (
                    <MetricItem icon={Share2} label="Shares" value={link.shares} />
                  )}

                  {/* YouTube metrics */}
                  {link.subscribed !== null && link.subscribed !== undefined && (
                    <MetricItem icon={Youtube} label="Subscribed" value={link.subscribed ? 'Yes' : 'No'} />
                  )}
                  {link.videoViews !== null && link.videoViews !== undefined && (
                    <MetricItem icon={Eye} label="Views" value={formatNumber(link.videoViews)} />
                  )}
                  {link.watchTime !== null && link.watchTime !== undefined && (
                    <MetricItem icon={Clock} label="Watch Time" value={`${link.watchTime}m`} />
                  )}

                  {/* Email metrics */}
                  {link.emailOpens !== null && link.emailOpens !== undefined && (
                    <MetricItem icon={Mail} label="Opens" value={link.emailOpens} />
                  )}
                  {link.emailClicks !== null && link.emailClicks !== undefined && (
                    <MetricItem icon={Eye} label="Clicks" value={link.emailClicks} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
