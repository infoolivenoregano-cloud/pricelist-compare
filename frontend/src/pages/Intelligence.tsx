import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign,
  ShieldAlert, BarChart2, Percent, Package
} from 'lucide-react'
import { getCompare, getUploads, type CompareItem, type PriceEntry } from '../api/client'

function fmt(n: number) { return `$${n.toFixed(2)}` }
function fmtPct(n: number) { return `${n > 0 ? '+' : ''}${n.toFixed(1)}%` }

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
          <div className={`text-2xl font-black ${color}`}>{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
        <div className={`p-2 rounded-lg ${color.includes('green') ? 'bg-green-50' : color.includes('red') ? 'bg-red-50' : color.includes('yellow') ? 'bg-yellow-50' : 'bg-blue-50'}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  )
}

export default function Intelligence() {
  const [tab, setTab] = useState<'overview' | 'spikes' | 'margins' | 'forensics'>('overview')

  const { data: compare } = useQuery({
    queryKey: ['compare'],
    queryFn: () => getCompare(),
  })
  const { data: uploads = [] } = useQuery({
    queryKey: ['uploads'],
    queryFn: getUploads,
  })

  const stats = useMemo(() => {
    if (!compare) return null
    const items = compare.items
    const total = items.length
    const withMultiple = items.filter(i => Object.keys(i.prices).length >= 2).length
    const spikes = items.filter(i =>
      Object.values(i.prices).some(p => p.change_pct !== null && p.change_pct !== undefined && p.change_pct > 10)
    )
    const drops = items.filter(i =>
      Object.values(i.prices).some(p => p.change_pct !== null && p.change_pct !== undefined && p.change_pct < -10)
    )
    const savings = items.reduce((acc, item) => {
      const prices = Object.values(item.prices).map(p => p.price)
      if (prices.length < 2) return acc
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      return acc + (max - min)
    }, 0)
    const itemsWithMenu = items.filter(i => i.menu_price && i.best_distributor_id && i.prices[i.best_distributor_id])
    const avgFoodCost = itemsWithMenu.length > 0
      ? itemsWithMenu.reduce((acc, i) => {
          const p = i.prices[i.best_distributor_id!]
          return acc + (p.price / i.menu_price! * 100)
        }, 0) / itemsWithMenu.length
      : null

    return { total, withMultiple, spikes, drops, savings, avgFoodCost, items }
  }, [compare])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'spikes', label: `Price Spikes ${stats ? `(${stats.spikes.length})` : ''}` },
    { id: 'margins', label: 'Margin Analysis' },
    { id: 'forensics', label: 'Invoice Forensics' },
  ] as const

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <BarChart2 size={20} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Food Cost Intelligence</h1>
            <p className="text-xs text-gray-500">Distributor comparison · price forensics · margin protection</p>
          </div>
          <div className="ml-auto text-xs text-gray-400">
            Week of {compare?.week_date || '—'} · {stats?.total || 0} items tracked
          </div>
        </div>
        <div className="flex gap-1 mt-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-emerald-700 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!compare || !stats ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No data yet. Upload pricelists from at least two distributors.</p>
          </div>
        ) : (
          <>
            {tab === 'overview' && <OverviewTab stats={stats} compare={compare} uploads={uploads} />}
            {tab === 'spikes' && <SpikesTab items={stats.spikes} distributors={compare.distributors} />}
            {tab === 'margins' && <MarginsTab items={stats.items} distributors={compare.distributors} />}
            {tab === 'forensics' && <ForensicsTab items={stats.items} distributors={compare.distributors} uploads={uploads} />}
          </>
        )}
      </div>
    </div>
  )
}

function OverviewTab({ stats, compare, uploads }: { stats: any; compare: any; uploads: any[] }) {
  const topSavings = [...stats.items]
    .filter((i: CompareItem) => Object.keys(i.prices).length >= 2)
    .map((i: CompareItem) => {
      const prices = Object.values(i.prices).map((p: PriceEntry) => p.price)
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const bestDist = compare.distributors.find((d: any) => i.prices[d.id]?.price === min)
      return { ...i, savingsPerCase: max - min, bestDist }
    })
    .sort((a: any, b: any) => b.savingsPerCase - a.savingsPerCase)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Items Tracked" value={String(stats.total)} sub="across all distributors" color="text-blue-600" icon={Package} />
        <StatCard label="Price Spikes" value={String(stats.spikes.length)} sub=">10% increase this week" color="text-red-600" icon={AlertTriangle} />
        <StatCard label="Max Savings Available" value={fmt(stats.savings)} sub="choosing cheapest per item" color="text-emerald-700" icon={DollarSign} />
        <StatCard
          label="Avg Food Cost %"
          value={stats.avgFoodCost ? `${stats.avgFoodCost.toFixed(1)}%` : 'Add menu prices'}
          sub={stats.avgFoodCost ? (stats.avgFoodCost < 30 ? '✓ On target' : stats.avgFoodCost < 35 ? '⚠ Watch this' : '⛔ Over budget') : 'in Item Catalog'}
          color={stats.avgFoodCost ? (stats.avgFoodCost < 30 ? 'text-emerald-700' : stats.avgFoodCost < 35 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400'}
          icon={Percent}
        />
      </div>

      {/* Top savings opportunities */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Top Savings Opportunities This Week</h2>
          <p className="text-xs text-gray-500 mt-0.5">Biggest price gaps between distributors for the same item</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium">Item</th>
              <th className="text-left px-5 py-2.5 font-medium">Best Price</th>
              <th className="text-left px-5 py-2.5 font-medium">Highest Price</th>
              <th className="text-right px-5 py-2.5 font-medium">Save Per Case</th>
            </tr>
          </thead>
          <tbody>
            {topSavings.map((item: any) => {
              const prices = Object.values(item.prices) as PriceEntry[]
              const maxPrice = Math.max(...prices.map(p => p.price))
              return (
                <tr key={item.canonical_id} className="border-t border-gray-100 hover:bg-emerald-50/30">
                  <td className="px-5 py-3 font-medium text-gray-900">{item.canonical_name}</td>
                  <td className="px-5 py-3">
                    <span className="text-emerald-700 font-bold">{fmt(Math.min(...prices.map(p => p.price)))}</span>
                    {item.bestDist && <span className="ml-1.5 text-xs text-gray-400">({item.bestDist.name})</span>}
                  </td>
                  <td className="px-5 py-3 text-red-500">{fmt(maxPrice)}</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmt(item.savingsPerCase)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Upload history */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-3">Upload History</h2>
        <div className="space-y-2">
          {uploads.slice(0, 8).map((u: any) => (
            <div key={u.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.distributor_color }} />
                <span className="font-medium">{u.distributor_name}</span>
                <span className="text-gray-400">— {u.filename}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <span>{u.item_count} items</span>
                <span>{u.week_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpikesTab({ items, distributors }: { items: CompareItem[]; distributors: any[] }) {
  const spikes = items.flatMap(item =>
    Object.entries(item.prices)
      .filter(([, p]) => p.change_pct !== null && p.change_pct !== undefined && p.change_pct > 5)
      .map(([distId, p]) => ({
        item,
        dist: distributors.find(d => d.id === Number(distId)),
        ...p,
      }))
  ).sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))

  const drops = items.flatMap(item =>
    Object.entries(item.prices)
      .filter(([, p]) => p.change_pct !== null && p.change_pct !== undefined && p.change_pct < -5)
      .map(([distId, p]) => ({
        item,
        dist: distributors.find(d => d.id === Number(distId)),
        ...p,
      }))
  ).sort((a, b) => (a.change_pct ?? 0) - (b.change_pct ?? 0))

  return (
    <div className="space-y-6">
      {/* Price Spike Alert Banner */}
      {spikes.filter(s => (s.change_pct ?? 0) > 10).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <ShieldAlert size={20} className="text-red-600 shrink-0" />
          <div>
            <div className="font-bold text-red-800">
              {spikes.filter(s => (s.change_pct ?? 0) > 10).length} items spiked over 10% this week
            </div>
            <div className="text-sm text-red-600">Review before placing orders — consider substitutes or portion adjustments.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Spikes */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-red-600" />
            <span className="font-bold text-red-800">Price Increases</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-left px-4 py-2">Distributor</th>
                <th className="text-right px-4 py-2">Now</th>
                <th className="text-right px-4 py-2">Was</th>
                <th className="text-right px-4 py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {spikes.slice(0, 15).map((s, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[180px] truncate">{s.item.canonical_name}</td>
                  <td className="px-4 py-2.5">
                    {s.dist && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dist.color }} />
                        {s.dist.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-red-700 font-bold">{fmt(s.price)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{s.prev_price ? fmt(s.prev_price) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${(s.change_pct ?? 0) > 10 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      +{s.change_pct?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {spikes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No significant price increases this week.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Drops */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
            <TrendingDown size={15} className="text-emerald-600" />
            <span className="font-bold text-emerald-800">Price Decreases</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-left px-4 py-2">Distributor</th>
                <th className="text-right px-4 py-2">Now</th>
                <th className="text-right px-4 py-2">Was</th>
                <th className="text-right px-4 py-2">Saved</th>
              </tr>
            </thead>
            <tbody>
              {drops.slice(0, 15).map((s, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[180px] truncate">{s.item.canonical_name}</td>
                  <td className="px-4 py-2.5">
                    {s.dist && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dist.color }} />
                        {s.dist.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-700 font-bold">{fmt(s.price)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{s.prev_price ? fmt(s.prev_price) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {s.change_pct?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {drops.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No significant price drops this week.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MarginsTab({ items, distributors }: { items: CompareItem[]; distributors: any[] }) {
  const withMargin = items
    .filter(i => i.menu_price && i.best_distributor_id && i.prices[i.best_distributor_id])
    .map(i => {
      const bestPrice = i.prices[i.best_distributor_id!].price
      const foodCost = bestPrice / i.menu_price! * 100
      const margin = 100 - foodCost
      return { ...i, bestPrice, foodCost, margin }
    })
    .sort((a, b) => b.foodCost - a.foodCost)

  const danger = withMargin.filter(i => i.foodCost >= 35)
  const warning = withMargin.filter(i => i.foodCost >= 28 && i.foodCost < 35)
  const healthy = withMargin.filter(i => i.foodCost < 28)

  return (
    <div className="space-y-6">
      {withMargin.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Percent size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No menu prices set yet.</p>
          <p className="text-sm mt-1">Go to <strong>Item Catalog</strong> and enter your menu prices to see margin analysis.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 border-l-4 border-red-500">
              <div className="text-xs text-gray-500 mb-1">Over Budget (&gt;35%)</div>
              <div className="text-2xl font-black text-red-600">{danger.length}</div>
              <div className="text-xs text-gray-400">items need attention</div>
            </div>
            <div className="card p-4 border-l-4 border-yellow-500">
              <div className="text-xs text-gray-500 mb-1">Watch (28–35%)</div>
              <div className="text-2xl font-black text-yellow-600">{warning.length}</div>
              <div className="text-xs text-gray-400">items approaching limit</div>
            </div>
            <div className="card p-4 border-l-4 border-emerald-500">
              <div className="text-xs text-gray-500 mb-1">Healthy (&lt;28%)</div>
              <div className="text-2xl font-black text-emerald-600">{healthy.length}</div>
              <div className="text-xs text-gray-400">items on target</div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 font-bold text-gray-800">Margin Breakdown by Item</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-2.5">Item</th>
                  <th className="text-right px-5 py-2.5">Best Cost</th>
                  <th className="text-right px-5 py-2.5">Menu Price</th>
                  <th className="text-right px-5 py-2.5">Food Cost %</th>
                  <th className="text-right px-5 py-2.5">Gross Margin</th>
                  <th className="text-center px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {withMargin.map(item => (
                  <tr key={item.canonical_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium">{item.canonical_name}</td>
                    <td className="px-5 py-2.5 text-right">{fmt(item.bestPrice)}</td>
                    <td className="px-5 py-2.5 text-right">{fmt(item.menu_price!)}</td>
                    <td className={`px-5 py-2.5 text-right font-bold ${item.foodCost >= 35 ? 'text-red-600' : item.foodCost >= 28 ? 'text-yellow-600' : 'text-emerald-700'}`}>
                      {item.foodCost.toFixed(1)}%
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-700">{item.margin.toFixed(1)}%</td>
                    <td className="px-5 py-2.5 text-center">
                      {item.foodCost >= 35
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">⛔ Over</span>
                        : item.foodCost >= 28
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">⚠ Watch</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">✓ Good</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function ForensicsTab({ items, distributors, uploads }: { items: CompareItem[]; distributors: any[]; uploads: any[] }) {
  // Identify anomalies: items where one distributor is >20% more expensive than cheapest
  const anomalies = items
    .filter(i => Object.keys(i.prices).length >= 2)
    .flatMap(i => {
      const prices = Object.entries(i.prices).map(([did, p]) => ({
        did: Number(did),
        price: p.price,
        dist: distributors.find(d => d.id === Number(did)),
      }))
      const minPrice = Math.min(...prices.map(p => p.price))
      return prices
        .filter(p => ((p.price - minPrice) / minPrice * 100) > 20)
        .map(p => ({
          item: i,
          distributor: p.dist,
          price: p.price,
          minPrice,
          overcharge: p.price - minPrice,
          overchargePct: (p.price - minPrice) / minPrice * 100,
        }))
    })
    .sort((a, b) => b.overchargePct - a.overchargePct)

  // Distributor summary
  const distSummary = distributors.map(dist => {
    const distItems = items.filter(i => i.prices[dist.id])
    const cheapestCount = distItems.filter(i => i.best_distributor_id === dist.id).length
    const avgPrice = distItems.length > 0
      ? distItems.reduce((s, i) => s + i.prices[dist.id].price, 0) / distItems.length
      : 0
    const upload = uploads.find(u => u.distributor_id === dist.id)
    return { dist, itemCount: distItems.length, cheapestCount, avgPrice, upload }
  })

  return (
    <div className="space-y-6">
      {/* Distributor Report Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {distSummary.map(({ dist, itemCount, cheapestCount, avgPrice }) => (
          <div key={dist.id} className="card p-4 border-t-4" style={{ borderTopColor: dist.color }}>
            <div className="font-bold text-gray-900 mb-3">{dist.name}</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cheapest</span>
                <span className="font-bold text-emerald-700">{cheapestCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Price</span>
                <span className="font-medium">{avgPrice > 0 ? fmt(avgPrice) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Win Rate</span>
                <span className="font-bold">{itemCount > 0 ? `${Math.round(cheapestCount / itemCount * 100)}%` : '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overcharge Detection */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShieldAlert size={16} className="text-orange-600" />
          <span className="font-bold text-gray-800">Overcharge Detection</span>
          <span className="ml-2 text-xs text-gray-400">Items priced &gt;20% above cheapest option</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-2.5">Item</th>
              <th className="text-left px-5 py-2.5">Overcharging Distributor</th>
              <th className="text-right px-5 py-2.5">Their Price</th>
              <th className="text-right px-5 py-2.5">Cheapest Available</th>
              <th className="text-right px-5 py-2.5">You'd Overpay</th>
              <th className="text-right px-5 py-2.5">% Over</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.slice(0, 20).map((a, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-orange-50/30">
                <td className="px-5 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">{a.item.canonical_name}</td>
                <td className="px-5 py-2.5">
                  {a.distributor && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.distributor.color }} />
                      {a.distributor.name}
                    </span>
                  )}
                </td>
                <td className="px-5 py-2.5 text-right text-red-600 font-bold">{fmt(a.price)}</td>
                <td className="px-5 py-2.5 text-right text-emerald-700">{fmt(a.minPrice)}</td>
                <td className="px-5 py-2.5 text-right font-bold text-orange-600">{fmt(a.overcharge)}</td>
                <td className="px-5 py-2.5 text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                    +{a.overchargePct.toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
            {anomalies.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No significant overcharges detected — pricing looks competitive across distributors.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
