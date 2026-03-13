'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { getRenderableAvatarUrl } from '@/lib/avatar-url'
import { cn, getInitials } from '@/lib/utils'

export interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const renderableSrc = getRenderableAvatarUrl(src)
  const [imgSrc, setImgSrc] = useState<string | null>(renderableSrc)

  useEffect(() => {
    setImgSrc(renderableSrc)
  }, [renderableSrc])

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  if (imgSrc) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0', sizes[size], className)}>
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgSrc(null)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-vault-gray flex items-center justify-center font-medium text-warm-white',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
