'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Select } from '@/components/ui'
import { User, Lock, Bell, Palette, Music, Check, Loader2, ExternalLink } from 'lucide-react'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload'

export default function SettingsPage() {
  const { data: session, update } = useSession()

  const [artistName, setArtistName] = useState('')
  const [email, setEmail] = useState('')
  const [spotifyArtistId, setSpotifyArtistId] = useState('')
  const [pricingTier, setPricingTier] = useState('PRIVATE_CIRCLE')
  const [canOverrideTier, setCanOverrideTier] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setArtistName(session.user.artistName || '')
      setEmail(session.user.email || '')
      setSpotifyArtistId(session.user.spotifyArtistId || '')
    }
  }, [session])

  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        const res = await fetch('/api/settings/profile', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setPricingTier(data?.user?.pricingTier || 'PRIVATE_CIRCLE')
          setCanOverrideTier(Boolean(data?.controls?.canOverrideTier))
        }
      } catch (err) {
        console.error('Failed to load settings profile:', err)
      }
    }
    loadProfileSettings()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName,
          email,
          spotifyArtistId,
          ...(canOverrideTier ? { pricingTier } : {}),
        }),
      })

      if (res.ok) {
        setSaved(true)
        await update() // Refresh session
        const data = await res.json()
        if (data?.user?.pricingTier) {
          setPricingTier(data.user.pricingTier)
        }
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-accent" />
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 pb-2">
              <ProfilePhotoUpload
                currentPhoto={session?.user?.image}
                onPhotoChange={async (dataUrl) => {
                  const res = await fetch('/api/settings/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: dataUrl }),
                  })
                  if (!res.ok) throw new Error('Failed to upload')
                  await update()
                }}
                size="md"
              />
              <p className="text-body-sm text-gray-500 font-light">
                Hover to change photo
              </p>
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <Input
              label="Creator Name"
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your name or brand"
            />
            <Button
              variant="outline"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Spotify Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-accent" />
              <CardTitle>Spotify ID (Optional)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body-sm text-gray-500 font-light">
              Your Spotify Artist ID allows fans to verify their listening history with you.
              Find it in your Spotify for Artists dashboard or from your artist profile URL.
            </p>
            <Input
              label="Spotify Artist ID"
              type="text"
              value={spotifyArtistId}
              onChange={(e) => setSpotifyArtistId(e.target.value)}
              placeholder="e.g., 4Z8W4fKeB5YxbusRsdQVPb"
              hint="From spotify.com/artist/[THIS_ID] or Spotify for Artists"
            />
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Spotify ID'
                )}
              </Button>
              <a
                href="https://artists.spotify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-gray-500 hover:text-accent flex items-center gap-1 transition-colors"
              >
                Open Spotify for Artists
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tier (Admin/Test Control) */}
        {canOverrideTier && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-accent" />
                <CardTitle>Pricing Tier Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-gray-500 font-light">
                Admin control for testing entitlements and campaign gating behavior.
              </p>
              <Select
                label="Current Pricing Tier"
                value={pricingTier}
                onChange={(e) => setPricingTier(e.target.value)}
                variant="boxed"
                options={[
                  { value: 'STARTER', label: 'Starter' },
                  { value: 'PRIVATE_CIRCLE', label: 'Private Circle' },
                  { value: 'PATRON_GROWTH', label: 'Patron Growth' },
                  { value: 'SOVEREIGN', label: 'Sovereign' },
                ]}
              />
              <Button
                variant="outline"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Tier'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-accent" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
            />
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-accent" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'New Core fan alerts', description: 'Get notified when a fan reaches Core status' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of your fan growth' },
                { label: 'Platform sync alerts', description: 'Notifications when platform connections need attention' },
              ].map((item, index) => (
                <label key={index} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-body-sm font-medium text-white">{item.label}</p>
                    <p className="text-caption text-gray-500">{item.description}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-[#1a1a1a] rounded-full peer peer-checked:bg-accent transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-accent" />
              <CardTitle>Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-gray-500 font-light">
              Imprint uses a dark theme optimized for long sessions. More themes coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-status-error/30">
          <CardHeader>
            <CardTitle className="text-status-error">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-gray-500 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
