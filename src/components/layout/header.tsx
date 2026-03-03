'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui'
import { Bell, Search } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-black border-b border-[#1a1a1a] flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search fans, insights..."
          className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#333] transition-all duration-200"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-white transition-colors hover:bg-[#111]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {session?.user?.artistName || session?.user?.name || 'Artist'}
            </p>
            <p className="text-xs text-gray-500">
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
