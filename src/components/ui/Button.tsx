import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
  title?: string
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-civic disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-900 text-white hover:bg-brand-800 shadow-sm active:bg-brand-950 dark:bg-white dark:text-brand-900 dark:hover:bg-brand-100',
  secondary:
    'bg-emerald-civic text-white hover:bg-emerald-civic-deep shadow-sm shadow-emerald-500/25 active:bg-emerald-700',
  success:
    'bg-emerald-civic text-white hover:bg-emerald-civic-deep shadow-sm active:bg-emerald-700',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-sm active:bg-red-700',
  outline:
    'border border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50 dark:border-white/15 dark:bg-transparent dark:text-brand-100 dark:hover:bg-white/5',
  ghost:
    'text-brand-600 hover:bg-brand-100/70 dark:text-brand-300 dark:hover:bg-white/8',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
  ariaLabel,
  title,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
