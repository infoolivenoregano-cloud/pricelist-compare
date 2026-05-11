import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Trash2, Tag, Truck } from 'lucide-react'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

type TabId = 'distributors' | 'chat'

interface Distributor {
  id: number
  name: string
  color: string
  latest_upload: string | null
  has_mapping: boolean
}

interface ChatMsg {
  id: number
  author: string
  text: string
  item_ref: string | null
  created_at: string
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6',
  '#0e7490', '#0369a1', '#7c3aed', '#6d28d9',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h)]
}

export default function Distributors() {
  const [tab, setTab] = useState<TabId>('distributors')
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [author, setAuthor] = useState(() => localStorage.getItem('chat_author') || '')
  const [text, setText] = useState('')
  const [itemRef, setItemRef] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`${BASE}/distributors`).then(r => r.json()).then(setDistributors)
  }, [])

  useEffect(() => {
    if (tab !== 'chat') return
    loadMessages()
    pollRef.current = setInterval(loadMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [tab])

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  function loadMessages() {
    fetch(`${BASE}/chat`).then(r => r.json()).then(setMessages)
  }

  async function send() {
    if (!text.trim() || !author.trim()) return
    setSending(true)
    localStorage.setItem('chat_author', author)
    await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: author.trim(), text: text.trim(), item_ref: itemRef.trim() || null }),
    })
    setText('')
    setItemRef('')
    setShowTagInput(false)
    await loadMessages()
    setSending(false)
  }

  async function deleteMsg(id: number) {
    await fetch(`${BASE}/chat/${id}`, { method: 'DELETE' })
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'distributors', label: 'Distributors' },
    { id: 'chat', label: 'Community Chat' },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 bg-white border-b border-gray-100">
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Olive &amp; Oregano · Procurement</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {tab === 'distributors' ? 'Distributors' : 'Community Chat'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">
          {tab === 'distributors'
            ? `${distributors.length} active distributors`
            : 'Discuss prices, availability, and ordering decisions'}
        </p>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={tab === t.id
                ? { borderColor: '#1e40af', color: '#1e40af' }
                : { borderColor: 'transparent', color: '#9ca3af' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distributors tab */}
      {tab === 'distributors' && (
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {distributors.map(d => (
              <div key={d.id} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="font-bold text-base text-gray-800 truncate">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Truck size={13} className="text-gray-300" />
                  <span className="text-xs text-gray-400">
                    {d.latest_upload ? `Last upload: ${d.latest_upload}` : 'No uploads yet'}
                  </span>
                </div>
                <div className="mt-auto">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${d.has_mapping ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {d.has_mapping ? 'Mapped' : 'No mapping'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Chat tab */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 px-8 py-6 gap-4">
          {/* Messages */}
          <div
            className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
          >
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 py-16">
                <MessageCircle size={40} />
                <span className="text-sm">No messages yet. Start the conversation.</span>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className="flex gap-3 group">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: avatarColor(msg.author) }}
                >
                  {initials(msg.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-800">{msg.author}</span>
                    <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
                    {msg.item_ref && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        <Tag size={9} />
                        {msg.item_ref}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            {showTagInput && (
              <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100">
                <Tag size={13} style={{ color: '#2563eb' }} />
                <input
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-300"
                  placeholder="Tag an item (e.g. ALMOND SLICED BLANCHED)"
                  value={itemRef}
                  onChange={e => setItemRef(e.target.value)}
                />
                <button onClick={() => { setShowTagInput(false); setItemRef('') }} className="text-xs text-gray-400 hover:text-gray-600">remove</button>
              </div>
            )}
            <div className="flex items-end">
              <input
                className="w-28 text-xs font-semibold border-r border-gray-100 px-3 py-3.5 outline-none text-gray-700 placeholder-gray-400 bg-gray-50"
                placeholder="Your name"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
              <textarea
                className="flex-1 text-sm px-4 py-3.5 outline-none resize-none text-gray-700 placeholder-gray-400 leading-snug"
                placeholder="Type a message… (Enter to send)"
                rows={1}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                style={{ maxHeight: 120 }}
              />
              <div className="flex items-center gap-1 pr-3 pb-2.5">
                <button
                  onClick={() => setShowTagInput(v => !v)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: showTagInput ? '#2563eb' : '#d1d5db' }}
                  title="Tag an item"
                >
                  <Tag size={15} />
                </button>
                <button
                  onClick={send}
                  disabled={!text.trim() || !author.trim() || sending}
                  className="p-2 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: '#1e40af', color: '#fff' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
