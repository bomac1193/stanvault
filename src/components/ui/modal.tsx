'use client'

import { Fragment, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'w-full bg-vault-dark border border-vault-gray rounded-xl shadow-2xl',
                sizes[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || description) && (
                <div className="px-6 py-4 border-b border-vault-gray">
                  <div className="flex items-start justify-between">
                    <div>
                      {title && (
                        <h2 className="text-lg font-semibold text-warm-white">{title}</h2>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-vault-muted">{description}</p>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1 text-vault-muted hover:text-warm-white transition-colors rounded-lg hover:bg-vault-gray"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}
