'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/providers/query-provider'
import { Sidebar, Header } from '@/components/layout'
import { usePrefetchAll } from '@/hooks/use-prefetch'

function DashboardShell({ children }: { children: React.ReactNode }) {
  // Prefetch all tab data on first load — every tab is instant after this
  usePrefetchAll()

  return (
    <div className="min-h-screen bg-vault-black">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <DashboardShell>{children}</DashboardShell>
      </QueryProvider>
    </SessionProvider>
  )
}
