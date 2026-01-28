'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Link2,
  Lightbulb,
  Download,
  LogOut,
  Settings,
  Gift,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { LogoMark } from '@/components/brand/Logo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/fans', label: 'Fans', icon: Users },
  { href: '/drops', label: 'Drops', icon: Gift },
  { href: '/connections', label: 'Connect', icon: Link2 },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/export', label: 'Export', icon: Download },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="block">
          <LogoMark size="lg" />
          <p className="text-caption text-gray-600 uppercase tracking-widest mt-2">
            Artist Portal
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-minimal">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-all duration-200',
                isActive
                  ? 'text-white border-l-2 border-l-accent bg-gray-900/50'
                  : 'text-gray-500 hover:text-white hover:bg-gray-900/30 border-l-2 border-transparent'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-caption uppercase tracking-widest">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-800 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-all duration-200 border-l-2 border-transparent hover:bg-gray-900/30"
        >
          <Settings className="w-4 h-4" />
          <span className="text-caption uppercase tracking-widest">Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-all duration-200 border-l-2 border-transparent hover:bg-gray-900/30"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-caption uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
