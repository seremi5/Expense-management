import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog Content */}
      <div className="relative z-50">{children}</div>
    </div>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 pb-4 border-b border-gray-200',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-gray-600 mt-1', className)}>{children}</p>
}

interface DialogBodyProps {
  children: React.ReactNode
  className?: string
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return <div className={cn('p-6 space-y-4', className)}>{children}</div>
}

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200',
        className
      )}
    >
      {children}
    </div>
  )
}
