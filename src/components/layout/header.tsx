'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui'
import { Bell, Search } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-vault-darker border-b border-vault-gray flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-muted" />
        <input
          type="text"
          placeholder="Search fans, insights..."
          className="w-full pl-10 pr-4 py-2 bg-vault-dark border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-vault-muted hover:text-warm-white transition-colors rounded-lg hover:bg-vault-gray">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-warm-white">
              {session?.user?.artistName || session?.user?.name || 'Artist'}
            </p>
            <p className="text-xs text-vault-muted">
              {session?.user?.email}
            </p>
          </div>
          <Avatar
            src={session?.user?.image}
            name={session?.user?.name || 'User'}
            size="md"
          />
        </div>
      </div>
    </header>
  )
}
