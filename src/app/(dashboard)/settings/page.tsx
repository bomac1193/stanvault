'use client'

import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@/components/ui'
import { User, Lock, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

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
              <User className="w-5 h-5 text-gold" />
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={session?.user?.email || ''}
              disabled
              hint="Email cannot be changed"
            />
            <Input
              label="Artist Name"
              type="text"
              defaultValue={session?.user?.artistName || ''}
              placeholder="Your artist or band name"
            />
            <Button variant="secondary">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gold" />
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
            <Button variant="secondary">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gold" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'New superfan alerts', description: 'Get notified when a fan reaches superfan status' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of your fan growth' },
                { label: 'Platform sync alerts', description: 'Notifications when platform connections need attention' },
              ].map((item, index) => (
                <label key={index} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-warm-white">{item.label}</p>
                    <p className="text-xs text-vault-muted">{item.description}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-vault-gray rounded-full peer peer-checked:bg-gold transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-warm-white rounded-full peer-checked:translate-x-4 transition-transform" />
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
              <Palette className="w-5 h-5 text-gold" />
              <CardTitle>Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-vault-muted">
              Stanvault uses a dark theme optimized for long sessions. More themes coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-status-error/30">
          <CardHeader>
            <CardTitle className="text-status-error">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-vault-muted mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
