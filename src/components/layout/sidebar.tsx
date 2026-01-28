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
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { LogoMark, Wordmark } from '@/components/brand/Logo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/fans', label: 'Fans', icon: Users },
  { href: '/connections', label: 'Connections', icon: Link2 },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/export', label: 'Export', icon: Download },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-vault-darker border-r border-vault-gray/60 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-vault-gray/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <LogoMark size="sm" />
          <Wordmark size="sm" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200',
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-vault-muted hover:text-warm-white hover:bg-vault-gray'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="nav-item">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-vault-gray/60 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-md text-vault-muted hover:text-warm-white hover:bg-vault-gray transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span className="nav-item">Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-vault-muted hover:text-warm-white hover:bg-vault-gray transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="nav-item">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
