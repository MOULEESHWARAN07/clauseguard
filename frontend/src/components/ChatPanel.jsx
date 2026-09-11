import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2, ChevronDown } from 'lucide-react'
import { streamChat, clearChatHistory } from '../services/api'
import { Spinner } from './UI'

export default function ChatPanel({ docId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I've analyzed your document. Ask me anything — risky clauses, payment terms, termination conditions, parties involved, etc.", sources: [] }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || streaming || !docId) return
    setInput('')

    const userMsg = { role: 'user', content: msg, sources: [] }
    const assistantMsg = { role: 'assistant', content: '', sources: [], streaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))

    try {
      await streamChat(
        docId, msg, history,
        (token) => {
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, content: last.content + token }
            return updated
          })
        },
        (chunks) => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], sources: chunks }
            return updated
          })
        },
        () => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false }
            return updated
          })
          setStreaming(false)
        }
      )
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: 'Error: ' + e.message, streaming: false }
        return updated
      })
      setStreaming(false)
    }
  }

  const clearChat = async () => {
    if (docId) await clearChatHistory(docId)
    setMessages([{ role: 'assistant', content: "Chat cleared! Ask me anything about the document.", sources: [] }])
  }

  const suggestions = [
    'What are the main risks?',
    'Summarize payment terms',
    'Any auto-renewal clauses?',
    'Who are the parties?'
  ]

  return (
    <div className="flex flex-col h-full bg-[#0d0d14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-600/20 flex items-center justify-center">
            <Bot size={13} className="text-brand-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Document AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <button onClick={clearChat} className="text-gray-600 hover:text-gray-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'user' ? 'bg-brand-600' : 'bg-[#1e1e2e]'}`}>
              {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-brand-400" />}
            </div>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-[#1a1a27] text-gray-300 rounded-tl-sm'} ${msg.streaming ? 'typing-cursor' : ''}`}>
                {msg.content || (msg.streaming ? '' : '...')}
              </div>
              {msg.sources?.length > 0 && (
                <SourcesBox sources={msg.sources} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1a1a27] text-gray-400 hover:text-brand-400 hover:bg-brand-600/10 border border-[#2e2e45] transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1e1e2e]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about any clause..."
            rows={1}
            className="flex-1 bg-[#13131a] border border-[#2e2e45] rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-600 resize-none"
            style={{ maxHeight: 100 }}
          />
          <button onClick={send} disabled={streaming || !input.trim()}
            className="w-9 h-9 flex-shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all">
            {streaming ? <Spinner size={14} /> : <Send size={14} className="text-white" />}
          </button>
        </div>
        <div className="text-xs text-gray-700 mt-1.5 text-center">Powered by Ollama · runs locally</div>
      </div>
    </div>
  )
}

function SourcesBox({ sources }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        {sources.length} source clause{sources.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {sources.map((s, i) => (
            <div key={i} className="text-xs text-gray-600 bg-[#13131a] border border-[#1e1e2e] rounded-lg px-2 py-1.5 leading-relaxed line-clamp-2">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
