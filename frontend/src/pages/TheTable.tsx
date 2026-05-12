import { useState } from 'react'
import {
  BarChart2, ShoppingBag, MessageSquare, CheckCircle2,
  Lock, ChevronRight, X, Users, TrendingDown, Zap, Star
} from 'lucide-react'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

const TIERS = [
  {
    id: 'professional',
    name: 'Professional',
    monthly: '$699–$999',
    annual: '$7,500–$10,800',
    tag: 'Most Popular',
    color: '#2563eb',
    features: [
      'Everything in Core Food Cost Intelligence',
      'Community price benchmarks (reciprocity-gated)',
      'Group Buy participation & proposals',
      'Community Intelligence Feed (The Feed)',
      'Vendor ratings & directory',
      'Direct messaging with other operators',
      'Price anomaly alerts (real-time)',
      'Weekly digest email',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: '$1,200+',
    annual: '$13,000+',
    tag: 'Multi-Location',
    color: '#7c3aed',
    features: [
      'Everything in Professional',
      'Multi-location management',
      'API access for integrations',
      'White-label reporting',
      'Priority support & dedicated account manager',
      'Custom vendor negotiations facilitated by 1LT',
      'Read-only investor dashboard',
      'Anonymized data licensing pipeline',
    ],
  },
]

const SUBSYSTEMS = [
  {
    icon: BarChart2,
    label: 'Price Intelligence Network',
    letter: 'A',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    description:
      'A shared invoice and pricing database giving every enrolled subscriber real-time benchmark data — what other operators are paying for common ingredients, from which vendors, at what volume. Fully anonymized at the individual restaurant level.',
    bullets: [
      'Community avg, median, min, max per product',
      'Reciprocity-gated: contribute invoices to unlock benchmarks',
      '90-day trend sparklines per ingredient',
      'Price anomaly alerts when you are overpaying',
    ],
  },
  {
    icon: ShoppingBag,
    label: 'Group Buy Marketplace',
    letter: 'B',
    color: '#0e7490',
    bg: 'rgba(14,116,144,0.08)',
    description:
      'Pool purchasing volume with other restaurants on common items. 1LT approaches vendors with a single aggregated purchase order and passes negotiated savings back to participants proportionally.',
    bullets: [
      'Browse & join active group buys by category',
      'Propose new group buys on any ingredient',
      'Real-time progress bars toward commitment threshold',
      '1.5% facilitation fee only on completed group orders',
    ],
  },
  {
    icon: MessageSquare,
    label: 'Community Intelligence Feed',
    letter: 'C',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    description:
      'A moderated, purpose-built communication layer where operators share vendor experiences, flag supply disruptions, propose group buys, ask operational questions, and access AI-curated market intelligence.',
    bullets: [
      'Post types: General, Vendor Alert, Price Share, Group Buy Proposal',
      'Vendor directory with 4-dimension ratings',
      'Direct messaging between member restaurants',
      'Anonymized by default — opt-in to show your name',
    ],
  },
]

interface FormState {
  restaurant_name: string
  contact_name: string
  email: string
  tier: string
  locations: string
  notes: string
}

export default function TheTable() {
  const [showModal, setShowModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    restaurant_name: '',
    contact_name: '',
    email: '',
    tier: '',
    locations: '1',
    notes: '',
  })

  function openModal(tier?: string) {
    setForm(f => ({ ...f, tier: tier ?? '' }))
    setSelectedTier(tier ?? null)
    setShowModal(true)
    setSubmitted(false)
  }

  function field(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.restaurant_name || !form.contact_name || !form.email || !form.tier) return
    setSubmitting(true)
    await fetch(`${BASE}/table/interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, locations: parseInt(form.locations) || 1 }),
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #071733 0%, #0b1e42 60%, #0f2d5e 100%)' }}>
        <div className="px-5 sm:px-10 pt-8 sm:pt-12 pb-10 sm:pb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(37,99,235,0.25)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }}>
            <Star size={11} fill="#93c5fd" />
            Premium Add-On · 1LT Systems
          </div>

          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            The Table
          </h1>
          <p className="text-lg font-medium mb-1" style={{ color: '#93c5fd' }}>
            Community Procurement Intelligence Network
          </p>
          <p className="text-sm max-w-xl leading-relaxed mb-8" style={{ color: 'rgba(147,197,253,0.65)' }}>
            The Table gives restaurant operators access to community price benchmarks, group buying power,
            and a shared intelligence feed — three tools no standalone platform currently combines.
            Sold as a premium tier above core Food Cost Intelligence.
          </p>

          <div className="flex flex-wrap gap-6 mb-8">
            {[
              { icon: TrendingDown, label: 'Real-time price benchmarks' },
              { icon: Users, label: 'Group buy purchasing power' },
              { icon: Zap, label: 'Anomaly alerts & vendor ratings' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(147,197,253,0.8)' }}>
                <Icon size={15} style={{ color: '#60a5fa' }} />
                {label}
              </div>
            ))}
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: '#2563eb', color: '#fff' }}
          >
            Request Access <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Sub-systems */}
      <div className="px-5 sm:px-10 py-8 sm:py-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Three integrated sub-systems</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {SUBSYSTEMS.map(s => {
            const Icon = s.icon
            return (
              <div key={s.letter} className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col gap-4"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>
                      Sub-system {s.letter}
                    </div>
                    <div className="font-bold text-gray-900 text-sm leading-tight">{s.label}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                <ul className="flex flex-col gap-1.5 mt-auto">
                  {s.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: s.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-5 sm:px-10 pb-8 sm:pb-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Pricing tiers</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {TIERS.map(tier => (
            <div key={tier.id} className="rounded-2xl bg-white border border-gray-100 p-7 flex flex-col gap-5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2"
                    style={{ background: `${tier.color}18`, color: tier.color }}>
                    {tier.tag}
                  </div>
                  <div className="text-xl font-black text-gray-900">{tier.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: tier.color }}>{tier.monthly}</div>
                  <div className="text-xs text-gray-400">per month</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tier.annual} / year</div>
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: tier.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openModal(tier.id)}
                className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: tier.color, color: '#fff' }}
              >
                Join The Table — {tier.name}
              </button>
            </div>
          ))}
        </div>

        {/* Facilitation fee note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 px-1">
          <Lock size={11} />
          Group Buy facilitation fee: 1.5% of order value per transaction, charged proportionally to participants. No fee on individual orders.
        </div>
      </div>

      {/* How reciprocity works */}
      <div className="px-5 sm:px-10 pb-10 sm:pb-12">
        <div className="rounded-2xl bg-white border border-gray-100 p-7" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">How the Reciprocity Gate works</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
            {[
              { step: '01', title: 'Upload your invoices', desc: 'Submit your real invoices for any ingredient you purchase. Your data is anonymized — no one sees your raw invoice.' },
              { step: '02', title: 'Unlock community benchmarks', desc: 'For every ingredient you contribute, you unlock the community price benchmark: average, median, min, max, and top 3 cheapest vendors.' },
              { step: '03', title: 'Stay current to stay unlocked', desc: 'Benchmarks require a contribution within the trailing 30 days. New members get a 14-day grace period to upload their first invoices.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col gap-2">
                <div className="text-3xl font-black" style={{ color: 'rgba(37,99,235,0.15)' }}>{item.step}</div>
                <div className="font-bold text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(7,23,51,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-7 pt-7 pb-5 flex items-start justify-between"
              style={{ background: 'linear-gradient(135deg, #071733, #0b1e42)', borderBottom: '1px solid rgba(96,165,250,0.12)' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>
                  The Table · Premium Access
                </div>
                <h2 className="text-xl font-black text-white">
                  {submitted ? 'Request Received' : 'Request Access'}
                </h2>
                {!submitted && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(147,197,253,0.6)' }}>
                    We'll reach out within 1 business day to confirm your subscription.
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors ml-4 mt-1">
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="px-7 py-10 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(37,99,235,0.1)' }}>
                  <CheckCircle2 size={28} style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg mb-1">You're on the list</div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    We've received your request for The Table {form.tier === 'enterprise' ? 'Enterprise' : 'Professional'} tier.
                    The 1LT team will contact you at <strong>{form.email}</strong> within 1 business day.
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: '#2563eb', color: '#fff' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-7 py-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Restaurant Name *</label>
                    <input
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                      value={form.restaurant_name}
                      onChange={e => field('restaurant_name', e.target.value)}
                      placeholder="e.g. Olive & Oregano"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Your Name *</label>
                    <input
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                      value={form.contact_name}
                      onChange={e => field('contact_name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                      value={form.email}
                      onChange={e => field('email', e.target.value)}
                      placeholder="you@restaurant.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tier *</label>
                    <select
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors bg-white"
                      value={form.tier}
                      onChange={e => field('tier', e.target.value)}
                    >
                      <option value="">Select tier…</option>
                      <option value="professional">Professional ($699–$999/mo)</option>
                      <option value="enterprise">Enterprise ($1,200+/mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Number of Locations</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                      value={form.locations}
                      onChange={e => field('locations', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (optional)</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors resize-none"
                      rows={2}
                      value={form.notes}
                      onChange={e => field('notes', e.target.value)}
                      placeholder="Questions, special requirements, or context…"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: '#1e40af', color: '#fff' }}>
                  {submitting ? 'Submitting…' : <>Request Access <ChevronRight size={15} /></>}
                </button>
                <p className="text-center text-xs text-gray-400">
                  No payment required now. The 1LT team will contact you to finalize your subscription.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
