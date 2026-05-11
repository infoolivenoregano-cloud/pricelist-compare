import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Search } from 'lucide-react'
import { getCompare, createOrder, type CompareItem, type PriceEntry } from '../api/client'

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}

function foodCostColor(pct: number) {
  if (pct < 28) return 'text-blue-700 font-semibold'
  if (pct < 35) return 'text-amber-600'
  return 'text-red-600 font-semibold'
}

function ChangeChip({ pct }: { pct?: number }) {
  if (pct == null) return <span className="text-gray-300 text-[11px]">—</span>
  if (Math.abs(pct) < 0.1) return <span className="text-gray-400 text-[11px]">±0%</span>
  if (pct > 0) return (
    <span className="inline-flex items-center gap-0.5 text-red-500 text-[11px] font-medium">
      <TrendingUp size={10} />+{pct.toFixed(1)}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-0.5 text-blue-600 text-[11px] font-medium">
      <TrendingDown size={10} />{pct.toFixed(1)}%
    </span>
  )
}

export default function Compare() {
  const [weekDate, setWeekDate] = useState<string>('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderName, setOrderName] = useState('')
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compare', weekDate],
    queryFn: () => getCompare(weekDate || undefined),
  })

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      setSelected({})
      setShowOrderModal(false)
      window.location.href = '/orders'
    },
  })

  const categories = useMemo(() => {
    if (!data) return []
    const cats = new Set(data.items.map(i => i.category || 'Uncategorized'))
    return Array.from(cats).sort()
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.items.filter(item => {
      if (category && (item.category || 'Uncategorized') !== category) return false
      if (search && !item.canonical_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data, search, category])

  const spikeCount = useMemo(() => {
    if (!data) return 0
    return data.items.filter(item =>
      Object.values(item.prices).some(p => p.change_pct != null && p.change_pct > 10)
    ).length
  }, [data])

  const bestDistribStats = useMemo(() => {
    if (!data || !data.distributors.length) return null
    const counts: Record<number, number> = {}
    data.items.forEach(item => {
      if (item.best_distributor_id != null) {
        counts[item.best_distributor_id] = (counts[item.best_distributor_id] || 0) + 1
      }
    })
    const entries = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))
    if (!entries.length) return null
    const bestId = Number(entries[0][0])
    const distrib = data.distributors.find(d => d.id === bestId)
    return { name: distrib?.name || '—', count: Number(entries[0][1]), color: distrib?.color }
  }, [data])

  const selectedCount = Object.keys(selected).length

  function toggleItem(item: CompareItem) {
    setSelected(prev => {
      if (prev[item.canonical_id] !== undefined) {
        const next = { ...prev }
        delete next[item.canonical_id]
        return next
      }
      const uploadItemId = item.best_distributor_id
        ? item.prices[item.best_distributor_id]?.upload_item_id
        : Object.values(item.prices)[0]?.upload_item_id
      if (!uploadItemId) return prev
      return { ...prev, [item.canonical_id]: uploadItemId }
    })
  }

  function handleBuildOrder() {
    if (!data || selectedCount === 0) return
    setOrderName(`Order — ${data.week_date}`)
    setShowOrderModal(true)
  }

  function handleConfirmOrder() {
    if (!data) return
    const lines = Object.entries(selected).map(([, uploadItemId]) => ({
      upload_item_id: uploadItemId,
      quantity: 1,
    }))
    createOrderMutation.mutate({ name: orderName || undefined, week_date: data.week_date, lines })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading prices…</div>
  )
  if (isError || !data) return (
    <div className="flex items-center justify-center h-full text-red-500 text-sm">Failed to load. Is the backend running?</div>
  )
  if (data.items.length === 0 && data.distributors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <ShoppingCart size={40} className="text-gray-200" />
        <p className="font-medium text-gray-600">No data yet</p>
        <p className="text-sm">Upload a pricelist to get started</p>
        <a href="/upload" className="mt-2 px-5 py-2 bg-blue-800 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors">
          Go to Upload
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Finsepa-style header ── */}
      <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0 shrink-0">

        {/* Breadcrumb */}
        <div className="text-[10px] text-gray-400 uppercase tracking-[0.18em] mb-3">
          Olive &amp; Oregano &nbsp;·&nbsp; Procurement
        </div>

        {/* Title + controls */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold text-gray-900 mb-1 leading-tight">Price Comparison</h1>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400">
              <span>{data.week_date}</span>
              <span className="text-gray-200">·</span>
              <span>{data.items.length} items</span>
              <span className="text-gray-200">·</span>
              <span>{data.distributors.length} distributors</span>
              {spikeCount > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="inline-flex items-center gap-0.5 text-orange-500 font-semibold">
                    <AlertTriangle size={11} />{spikeCount} spike{spikeCount !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <select
              className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white"
              value={weekDate}
              onChange={e => setWeekDate(e.target.value)}
            >
              <option value="">Latest</option>
              {data.available_weeks.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="text-xs border border-gray-200 rounded-full pl-7 pr-3 py-1.5 w-40 focus:outline-none focus:border-gray-400"
                placeholder="Search items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>

            {selectedCount > 0 && (
              <button
                onClick={handleBuildOrder}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-800 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart size={12} />
                Build Order ({selectedCount})
              </button>
            )}
          </div>
        </div>

        {/* ── Stats bar — like finsepa's price/sentiment overview ── */}
        <div className="flex items-end gap-8 py-4 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Items Shown</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{filtered.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">of {data.items.length} total</div>
          </div>

          {bestDistribStats && (
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Price Leader</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bestDistribStats.color }} />
                <span className="text-2xl font-bold text-blue-700 leading-none">{bestDistribStats.name}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">cheapest on {bestDistribStats.count} items</div>
            </div>
          )}

          {spikeCount > 0 && (
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Price Spikes</div>
              <div className="text-2xl font-bold text-orange-600 leading-none">{spikeCount}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">items up &gt;10% vs last week</div>
            </div>
          )}

          {/* Distributor legend pills — right-aligned like finsepa comparison chips */}
          <div className="ml-auto flex items-center gap-2">
            {data.distributors.map(d => (
              <div
                key={d.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] font-medium text-gray-700"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
                {!d.upload_id && <span className="text-gray-300">(no data)</span>}
              </div>
            ))}
            <span className="text-[11px] text-gray-400 ml-1">{filtered.length} items</span>
          </div>
        </div>

        {/* ── Tab row — like finsepa's Overview / Financials / Events tabs ── */}
        <div className="flex items-center -mb-px">
          {['Latest Prices', 'By Category', 'Margin View'].map((tab, i) => (
            <button
              key={tab}
              className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                i === 0
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedCount === filtered.length && filtered.length > 0}
                  onChange={() => {
                    if (selectedCount === filtered.length) {
                      setSelected({})
                    } else {
                      const next: Record<number, number> = {}
                      filtered.forEach(item => {
                        const uid = item.best_distributor_id
                          ? item.prices[item.best_distributor_id]?.upload_item_id
                          : Object.values(item.prices)[0]?.upload_item_id
                        if (uid) next[item.canonical_id] = uid
                      })
                      setSelected(next)
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest min-w-[220px]">Item</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-36">Category</th>
              {data.distributors.map(d => (
                <th key={d.id} className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest min-w-[130px]">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                </th>
              ))}
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-28">Best Price</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-24">Menu $</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-28">Food Cost%</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isChecked = selected[item.canonical_id] !== undefined
              const bestPrice = item.best_distributor_id
                ? item.prices[item.best_distributor_id]?.price
                : undefined
              const foodCostPct = item.menu_price && bestPrice
                ? (bestPrice / item.menu_price * 100)
                : null
              const hasSpike = Object.values(item.prices).some(
                p => p.change_pct != null && p.change_pct > 10,
              )

              return (
                <tr
                  key={item.canonical_id}
                  onClick={() => toggleItem(item)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded pointer-events-none"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {hasSpike && <AlertTriangle size={12} className="text-orange-400 shrink-0" />}
                      <span className="font-medium text-gray-900">{item.canonical_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-gray-400">{item.category || '—'}</td>

                  {data.distributors.map(d => {
                    const entry: PriceEntry | undefined = item.prices[d.id]
                    const isBest = d.id === item.best_distributor_id
                    if (!entry) {
                      return <td key={d.id} className="px-4 py-3.5 text-center text-gray-200">—</td>
                    }
                    return (
                      <td
                        key={d.id}
                        className={`px-4 py-3.5 text-center ${isBest ? 'bg-blue-50' : ''}`}
                      >
                        <div className={`font-semibold ${isBest ? 'text-blue-700' : 'text-gray-800'}`}>
                          {fmt(entry.price)}
                        </div>
                        {entry.pack_size && (
                          <div className="text-[10px] text-gray-400 mt-0.5">{entry.pack_size}</div>
                        )}
                        <ChangeChip pct={entry.change_pct} />
                      </td>
                    )
                  })}

                  <td className="px-4 py-3.5 text-center">
                    {bestPrice !== undefined
                      ? <span className="font-bold text-blue-700">{fmt(bestPrice)}</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-500">
                    {item.menu_price ? fmt(item.menu_price) : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {foodCostPct !== null
                      ? <span className={foodCostColor(foodCostPct)}>{foodCostPct.toFixed(0)}%</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-300 text-sm">No items match your filter.</div>
        )}
      </div>

      {/* ── Order modal ── */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-96">
            <h2 className="text-base font-bold text-gray-900 mb-1">Build Order List</h2>
            <p className="text-xs text-gray-400 mb-5">
              {selectedCount} items will be grouped by cheapest supplier. Adjust quantities after.
            </p>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Order name (optional)
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                value={orderName}
                onChange={e => setOrderName(e.target.value)}
                placeholder={`Order — ${data.week_date}`}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setShowOrderModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handleConfirmOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
