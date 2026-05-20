import { useState, useRef, useEffect } from 'react'
import type { Card } from '../../api/topics'
import Button from '../ui/Button'
import { X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  card: Card
  onClose: () => void
}

export default function ExplainPanel({ card, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const sendMessage = async (userText: string) => {
    const token = localStorage.getItem('recall_token')
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    let assistantText = ''
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch(`/api/cards/${card.id}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.token) {
                assistantText += parsed.token
                setMessages((m) => {
                  const updated = [...m]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantText,
                  }
                  return updated
                })
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      setMessages((m) => {
        const updated = [...m]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  useEffect(() => {
    if (messages.length === 0) {
      sendMessage(`Please explain this concept: ${card.question}`)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 w-full sm:w-96 h-[70vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-inter font-semibold text-sm text-gray-900 dark:text-white">Tutor Explanation</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{card.question}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-recall-purple text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {msg.content || (streaming && i === messages.length - 1 ? '▊' : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim() && !streaming) {
                e.preventDefault()
                sendMessage(input.trim())
              }
            }}
            disabled={streaming}
            placeholder="Ask a follow-up..."
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-recall-purple dark:focus:border-recall-violet transition-colors"
          />
          <button
            onClick={() => input.trim() && !streaming && sendMessage(input.trim())}
            disabled={!input.trim() || streaming}
            className="p-2 rounded-lg bg-recall-purple text-white disabled:opacity-50 hover:bg-recall-violet transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
