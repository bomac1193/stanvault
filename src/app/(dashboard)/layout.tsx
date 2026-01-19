'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/providers/query-provider'
import { Sidebar, Header } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <div className="min-h-screen bg-vault-black">
          <Sidebar />
          <div className="ml-64">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </SessionProvider>
  )
}
