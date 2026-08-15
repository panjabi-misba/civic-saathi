import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Trash2, Mic, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, CivicArea, Complaint, Language } from '@/types/civic'
import { MessageBubble } from '@/components/Assistant/MessageBubble'
import { TypingIndicator } from '@/components/Assistant/TypingIndicator'
import { SmartPrompts } from '@/components/Assistant/SmartPrompts'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { getAssistantReply } from '@/utils/assistant'
import { mockSpeechToText } from '@/utils/civicAI'
import { cn } from '@/utils/cn'

interface AssistantProps {
  t: (key: string) => string
  language: Language
  complaints: Complaint[]
  toastInfo: (title: string, message?: string) => void
  area?: CivicArea | null
}

const STORAGE_KEY = 'chat-messages'

function buildGreeting(language: Language): string {
  return language === 'hi'
    ? 'नमस्ते! मैं आपका नागरिक सहायक हूं। अपनी शिकायत, विभाग या रिपोर्टिंग के बारे में पूछें।'
    : language === 'mr'
      ? 'नमस्कार! मी तुमचा नागरी सहाय्यक आहे. तक्रार, विभाग किंवा अहवाल देण्याबद्दल विचारा.'
      : 'Namaste! I am Civic Saathi, your AI civic assistant. Ask me about your complaint, departments, or how to report an issue.'
}

export function Assistant({ t, language, complaints, toastInfo, area }: AssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = loadFromStorage<ChatMessage[]>(STORAGE_KEY, [])
    if (stored.length > 0) return stored
    const id = Math.random().toString(36).slice(2)
    return [
      {
        id,
        role: 'assistant',
        content: buildGreeting(language),
        timestamp: Date.now(),
      },
    ]
  })
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEY, messages)
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [input])

  const send = useCallback(
    (raw?: string) => {
      const question = (raw ?? input).trim()
      if (!question || typing) return
      setInput('')
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content: question,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setTyping(true)

      window.setTimeout(() => {
        const reply = getAssistantReply(question, complaints, language, area)
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: reply.text,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        setTyping(false)
      }, 850 + Math.random() * 500)
    },
    [input, typing, complaints, language, area],
  )

  const clearChat = () => {
    setMessages([
      {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: buildGreeting(language),
        timestamp: Date.now(),
      },
    ])
    toastInfo(t('assistant.newChat'))
  }

  const startRecording = () => {
    if (recording) return
    setRecording(true)
    window.setTimeout(() => {
      setRecording(false)
      const transcribed = mockSpeechToText('voice question about civic complaint')
      setInput(transcribed)
      taRef.current?.focus()
    }, 1400)
  }

  const promptList: string[] = [
    t('assistant.suggestions.q1'),
    t('assistant.suggestions.q2'),
    t('assistant.suggestions.q3'),
    t('assistant.suggestions.q4'),
    t('assistant.suggestions.q5'),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 text-white shadow-md"
            >
              <Bot className="h-6 w-6" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-civic opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-civic dark:border-brand-900" />
              </span>
            </motion.div>
            <div>
              <h2 className="font-display text-base font-bold text-brand-900 dark:text-white">
                {t('assistant.title')}
              </h2>
              <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-civic-deep dark:text-emerald-civic">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-civic" />
                {t('app.online')}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            aria-label={t('assistant.newChat')}
            title={t('assistant.newChat')}
            className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-white/12 dark:bg-white/5 dark:text-brand-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:block">{t('assistant.newChat')}</span>
          </button>
        </div>

        <div className="h-[420px] overflow-y-auto px-5 py-5 scrollbar-thin sm:h-[480px]">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                animate={i === messages.length - 1}
              />
            ))}
            {typing && <TypingIndicator t={t} />}
            <div ref={endRef} />
          </div>
        </div>

        <AnimatePresence>
          {messages.length <= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-brand-100 px-5 py-4 dark:border-white/10"
            >
              <SmartPrompts t={t} prompts={promptList} onSelect={send} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-brand-100 px-4 py-3.5 dark:border-white/10">
          <div className="flex items-end gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startRecording}
              aria-label={t('assistant.voice')}
              title={t('assistant.voice')}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
                recording
                  ? 'border-red-400 bg-red-500 text-white'
                  : 'border-brand-200 bg-white/70 text-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-white/12 dark:bg-white/5 dark:hover:bg-white/10',
              )}
            >
              {recording ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </motion.button>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder={t('assistant.placeholder')}
              aria-label={t('assistant.placeholder')}
              className="max-h-[140px] min-h-[44px] w-full resize-none rounded-xl border border-brand-200 bg-white/80 px-4 py-2.5 text-sm leading-relaxed text-brand-900 shadow-inner transition-colors placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-800/50 dark:text-brand-50 dark:placeholder:text-brand-500"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => send()}
              disabled={!input.trim() || typing}
              aria-label={t('assistant.send')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-civic text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-civic-deep disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
          <p className="mt-2 text-center text-[10px] text-brand-400">
            {t('assistant.sub')} · {t('common.demo')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
