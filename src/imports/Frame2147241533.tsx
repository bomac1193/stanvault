'use client'

import { ReactNode } from 'react'

type Frame2147241533Props = {
  children: ReactNode
}

export default function Frame2147241533({ children }: Frame2147241533Props) {
  return (
    <div className="h-full w-full border border-white/20 bg-black/35 backdrop-blur-sm p-4 md:p-5 overflow-auto">
      {children}
    </div>
  )
}
