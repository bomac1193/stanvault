'use client'

import { cn } from '@/lib/utils'

export interface Tab {
  value: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: Tab[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-vault-darker rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            value === tab.value
              ? 'bg-vault-gray text-warm-white'
              : 'text-vault-muted hover:text-warm-white'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-2 text-xs',
              value === tab.value ? 'text-warm-white/60' : 'text-vault-muted'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
