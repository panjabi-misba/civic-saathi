import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { ChatMessage } from '@/types/civic'
import { cn } from '@/utils/cn'

interface MessageBubbleProps {
  message: ChatMessage
  animate?: boolean
}

function renderRich(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-brand-900 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  )
}

export function MessageBubble({ message, animate = true }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn('flex items-end gap-2', isUser && 'flex-row-reverse')}
    >
      {!isUser && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-900 text-white shadow-sm">
          <svg viewBox="0 0 64 64" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M12 40 L20 24 L30 33 L42 21 L48 40 Z" fill="#10B981" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm sm:max-w-[75%]',
          isUser
            ? 'rounded-br-sm bg-brand-900 text-white dark:bg-white dark:text-brand-900'
            : 'rounded-bl-sm border border-brand-100 bg-white text-brand-700 dark:border-white/10 dark:bg-brand-800/60 dark:text-brand-100',
        )}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <p className="[&_strong]:font-bold">{renderRich(message.content)}</p>
        )}
        <p
          className={cn(
            'mt-1.5 flex items-center gap-1 text-[10px] font-medium',
            isUser ? 'justify-end text-white/50 dark:text-brand-900/50' : 'text-brand-400',
          )}
        >
          {!isUser && <Sparkles className="h-3 w-3 text-emerald-civic" />}
          {time}
        </p>
      </div>
    </motion.div>
  )
}
