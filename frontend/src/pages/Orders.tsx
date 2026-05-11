import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Printer, Trash2, ChevronRight } from 'lucide-react'
import { getOrders, getOrder, deleteOrder, updateOrderLine, removeOrderLine, type OrderSession } from '../api/client'

function fmt(n: number) { return `$${n.toFixed(2)}` }

export default function Orders() {
  const { id } = useParams<{ id?: string }>()
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(id ? Number(id) : null)

  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const { data: session } = useQuery({
    queryKey: ['order', selectedId],
    queryFn: () => getOrder(selectedId!),
    enabled: selectedId !== null,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      setSelectedId(null)
    },
  })

  const updateQtyMutation = useMutation({
    mutationFn: ({ sessionId, lineId, qty }: { sessionId: number; lineId: number; qty: number }) =>
      updateOrderLine(sessionId, lineId, qty),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', selectedId] }),
  })

  const removeMutation = useMutation({
    mutationFn: ({ sessionId, lineId }: { sessionId: number; lineId: number }) =>
      removeOrderLine(sessionId, lineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', selectedId] }),
  })

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="font-bold text-gray-900">Order Lists</h1>
          <p className="text-xs text-gray-400 mt-0.5">Created from Compare view</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orders.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No orders yet. Build one from the Compare view.
            </div>
          )}
          {orders.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedId === o.id ? 'bg-green-50 border-l-2 border-l-green-700' : ''
              }`}
            >
              <div>
                <div className="font-medium text-sm text-gray-900">{o.name || `Order #${o.id}`}</div>
                <div className="text-xs text-gray-400 mt-0.5">{o.week_date} · {o.lines.length} items</div>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-auto">
        {!selectedId && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select an order to view details
          </div>
        )}
        {selectedId && session && (
          <OrderDetail
            session={session}
            onDelete={() => {
              if (confirm('Delete this order?')) deleteMutation.mutate(session.id)
            }}
            onUpdateQty={(lineId, qty) => updateQtyMutation.mutate({ sessionId: session.id, lineId, qty })}
            onRemoveLine={(lineId) => removeMutation.mutate({ sessionId: session.id, lineId })}
          />
        )}
      </div>
    </div>
  )
}

function OrderDetail({ session, onDelete, onUpdateQty, onRemoveLine }: {
  session: OrderSession
  onDelete: () => void
  onUpdateQty: (lineId: number, qty: number) => void
  onRemoveLine: (lineId: number) => void
}) {
  // Group lines by distributor
  const byDistributor: Record<string, { name: string; color: string; lines: typeof session.lines }> = {}
  for (const line of session.lines) {
    const key = String(line.distributor_id)
    if (!byDistributor[key]) {
      byDistributor[key] = { name: line.distributor_name, color: line.distributor_color, lines: [] }
    }
    byDistributor[key].lines.push(line)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{session.name || `Order #${session.id}`}</h2>
          <p className="text-sm text-gray-500">Week of {session.week_date} · Created {new Date(session.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer size={15} /> Print
          </button>
          <button onClick={onDelete} className="btn-danger">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {session.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 mb-6">
          {session.notes}
        </div>
      )}

      <div className="space-y-6">
        {Object.values(byDistributor).map(group => {
          const subtotal = group.lines.reduce((s, l) => s + l.line_total, 0)
          return (
            <div key={group.name} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: group.color + '18' }}>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: group.color }} />
                  {group.name}
                </div>
                <span className="text-sm font-bold text-gray-700">Subtotal: {fmt(subtotal)}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Item</th>
                    <th className="text-left px-4 py-2 font-medium">SKU</th>
                    <th className="text-left px-4 py-2 font-medium">Pack</th>
                    <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                    <th className="text-center px-4 py-2 font-medium w-28">Qty</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map(line => (
                    <tr key={line.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{line.item_name}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{line.item_sku || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{line.item_pack_size || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{fmt(line.price)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min={0.1}
                          step={0.5}
                          value={line.quantity}
                          onChange={e => onUpdateQty(line.id, Number(e.target.value))}
                          className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">{fmt(line.line_total)}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => onRemoveLine(line.id)}
                          className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Grand Total</div>
          <div className="text-3xl font-bold text-green-800">{fmt(session.grand_total)}</div>
        </div>
      </div>
    </div>
  )
}
