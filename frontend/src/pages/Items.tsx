import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, Wand2, Trash2, Check, X, Pencil } from 'lucide-react'
import {
  getUnlinkedItems, getCanonicalItems, linkItem, autoLink,
  createAndLink, createCanonicalItem, updateCanonicalItem, deleteCanonicalItem,
  type UnlinkedItem, type CanonicalItem,
} from '../api/client'

function fmt(n: number) { return `$${n.toFixed(2)}` }

export default function Items() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'unlinked' | 'catalog'>('unlinked')
  const [newItemName, setNewItemName] = useState<Record<number, string>>({})
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<CanonicalItem>>({})

  const { data: unlinked = [], isLoading: ul } = useQuery({ queryKey: ['unlinked'], queryFn: getUnlinkedItems })
  const { data: catalog = [], isLoading: cl } = useQuery({ queryKey: ['canonical'], queryFn: getCanonicalItems })

  const autoLinkMutation = useMutation({
    mutationFn: autoLink,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['unlinked'] })
      qc.invalidateQueries({ queryKey: ['canonical'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
      alert(`Auto-linked ${res.linked} items.`)
    },
  })

  const linkMutation = useMutation({
    mutationFn: ({ uiId, cId }: { uiId: number; cId: number }) => linkItem(uiId, cId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unlinked'] })
      qc.invalidateQueries({ queryKey: ['canonical'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
    },
  })

  const createAndLinkMutation = useMutation({
    mutationFn: ({ uiId, name }: { uiId: number; name: string }) =>
      createAndLink(uiId, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unlinked'] })
      qc.invalidateQueries({ queryKey: ['canonical'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CanonicalItem> }) => updateCanonicalItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canonical'] })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCanonicalItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canonical'] })
      qc.invalidateQueries({ queryKey: ['unlinked'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
    },
  })

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Item Catalog</h1>
        <button
          className="btn-secondary"
          onClick={() => autoLinkMutation.mutate()}
          disabled={autoLinkMutation.isPending}
        >
          <Wand2 size={15} />
          {autoLinkMutation.isPending ? 'Linking…' : 'Auto-Link All'}
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['unlinked', 'catalog'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'unlinked' ? `Unlinked (${unlinked.length})` : `Catalog (${catalog.length})`}
          </button>
        ))}
      </div>

      {tab === 'unlinked' && (
        <div>
          {ul && <p className="text-gray-400">Loading…</p>}
          {!ul && unlinked.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Link2 size={36} className="mx-auto mb-3 text-gray-300" />
              <p>All items are linked. Great shape!</p>
            </div>
          )}
          <div className="space-y-3">
            {unlinked.map(item => (
              <UnlinkedCard
                key={item.id}
                item={item}
                catalog={catalog}
                onLink={(cId) => linkMutation.mutate({ uiId: item.upload_item_id, cId })}
                onCreateAndLink={(name) => {
                  createAndLinkMutation.mutate({ uiId: item.upload_item_id, name })
                }}
                newName={newItemName[item.id] || ''}
                setNewName={(v) => setNewItemName(m => ({ ...m, [item.id]: v }))}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'catalog' && (
        <div>
          {cl && <p className="text-gray-400">Loading…</p>}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Menu Price</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Linked Items</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {catalog.map(item => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    {editId === item.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input className="input text-xs py-1" value={editData.name ?? item.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                        </td>
                        <td className="px-4 py-2">
                          <input className="input text-xs py-1" value={editData.category ?? item.category ?? ''} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} placeholder="e.g. Proteins" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" className="input text-xs py-1 text-right" value={editData.menu_price ?? item.menu_price ?? ''} onChange={e => setEditData(d => ({ ...d, menu_price: e.target.value ? Number(e.target.value) : undefined }))} placeholder="0.00" />
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500">{item.linked_count}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => updateMutation.mutate({ id: item.id, data: editData })} className="p-1 text-green-700 hover:bg-green-50 rounded"><Check size={15} /></button>
                            <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={15} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{item.category || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{item.menu_price ? fmt(item.menu_price) : '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.linked_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                            {item.linked_count}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditId(item.id); setEditData({}) }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                            <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id) }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {catalog.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No catalog items yet. Link unlinked items to create them.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function UnlinkedCard({ item, catalog, onLink, onCreateAndLink, newName, setNewName }: {
  item: UnlinkedItem
  catalog: CanonicalItem[]
  onLink: (id: number) => void
  onCreateAndLink: (name: string) => void
  newName: string
  setNewName: (v: string) => void
}) {
  const [mode, setMode] = useState<'suggest' | 'search' | 'create'>('suggest')
  const [searchTerm, setSearchTerm] = useState('')

  const searchResults = catalog.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5)

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div
          className="w-2 h-2 rounded-full mt-2 shrink-0"
          style={{ backgroundColor: item.distributor_color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{item.name}</span>
            {item.sku && <span className="text-xs text-gray-400">#{item.sku}</span>}
            <span className="text-sm font-semibold text-gray-700">${item.price.toFixed(2)}</span>
            {item.pack_size && <span className="text-xs text-gray-400">{item.pack_size}</span>}
            <span className="text-xs text-gray-400">{item.distributor_name} · {item.week_date}</span>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            {item.suggestions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Suggestions:</span>
                {item.suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onLink(s.id)}
                    className="px-2.5 py-1 text-xs rounded-full border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 transition-colors"
                  >
                    {s.name} <span className="text-green-500">({s.score}%)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setMode('search')}
              className="text-xs text-blue-600 hover:underline"
            >
              Search catalog
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => { setMode('create'); setNewName(item.name) }}
              className="text-xs text-blue-600 hover:underline"
            >
              Create new item
            </button>
          </div>

          {mode === 'search' && (
            <div className="mt-2">
              <input
                className="input text-sm"
                placeholder="Search catalog…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden">
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => onLink(r.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      {r.name}
                      {r.category && <span className="ml-2 text-xs text-gray-400">{r.category}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div className="mt-2 flex gap-2">
              <input
                className="input text-sm flex-1"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Canonical item name"
                autoFocus
              />
              <button
                onClick={() => { if (newName.trim()) onCreateAndLink(newName.trim()) }}
                className="btn-primary text-xs"
              >
                <Plus size={13} /> Create &amp; Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
