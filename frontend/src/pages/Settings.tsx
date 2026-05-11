import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Check, X, Upload } from 'lucide-react'
import { getDistributors, createDistributor, updateDistributor, deleteDistributor, getUploads, deleteUpload, type Distributor } from '../api/client'

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#64748b']

export default function Settings() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'distributors' | 'uploads'>('distributors')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [newEmail, setNewEmail] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Distributor>>({})

  const { data: distributors = [] } = useQuery({ queryKey: ['distributors'], queryFn: getDistributors })
  const { data: uploads = [] } = useQuery({ queryKey: ['uploads'], queryFn: getUploads })

  const createMutation = useMutation({
    mutationFn: () => createDistributor({ name: newName, color: newColor, contact_email: newEmail || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distributors'] })
      setShowAdd(false)
      setNewName('')
      setNewEmail('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Distributor> }) => updateDistributor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distributors'] })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDistributor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['distributors'] }),
  })

  const deleteUploadMutation = useMutation({
    mutationFn: (id: number) => deleteUpload(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uploads'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
    },
  })

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold mb-6">Distributors &amp; Uploads</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['distributors', 'uploads'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'distributors' ? `Distributors (${distributors.length})` : `Uploads (${uploads.length})`}
          </button>
        ))}
      </div>

      {tab === 'distributors' && (
        <div>
          <div className="card overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Distributor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Column Map</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Latest Upload</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {distributors.map(d => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    {editId === d.id ? (
                      <>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {COLORS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setEditData(data => ({ ...data, color: c }))}
                                  className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                                  style={{ backgroundColor: c, borderColor: (editData.color || d.color) === c ? '#1f2937' : 'transparent' }}
                                />
                              ))}
                            </div>
                            <input className="input text-sm py-1 flex-1" value={editData.name ?? d.name} onChange={e => setEditData(data => ({ ...data, name: e.target.value }))} />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input className="input text-sm py-1" value={editData.contact_email ?? d.contact_email ?? ''} onChange={e => setEditData(data => ({ ...data, contact_email: e.target.value }))} placeholder="email@distributor.com" />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.has_mapping ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.has_mapping ? 'Saved' : 'None'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500 text-xs">{d.latest_upload || '—'}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => updateMutation.mutate({ id: d.id, data: editData })} className="p-1 text-green-700 hover:bg-green-50 rounded"><Check size={14} /></button>
                            <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="font-medium">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{d.contact_email || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.has_mapping ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.has_mapping ? 'Saved' : 'None'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">{d.latest_upload || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditId(d.id); setEditData({}) }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={13} /></button>
                            <button onClick={() => { if (confirm(`Delete ${d.name}? This will remove all their uploads.`)) deleteMutation.mutate(d.id) }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {distributors.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No distributors yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="btn-secondary">
              <Plus size={15} /> Add Distributor
            </button>
          ) : (
            <div className="card p-4">
              <h3 className="font-semibold mb-4">Add Distributor</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. US Foods, Sysco, Gordon" autoFocus />
                </div>
                <div>
                  <label className="label">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: c, borderColor: newColor === c ? '#1f2937' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Contact Email (optional)</label>
                  <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="orders@distributor.com" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="btn-primary"
                  >
                    {createMutation.isPending ? 'Adding…' : 'Add Distributor'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'uploads' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Distributor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">File</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Week Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Items</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Uploaded</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {uploads.map(u => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.distributor_color }} />
                      {u.distributor_name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{u.filename}</td>
                  <td className="px-4 py-2.5 text-center font-medium">{u.week_date}</td>
                  <td className="px-4 py-2.5 text-center">{u.item_count}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => { if (confirm('Delete this upload? Items linked from it will be unlinked.')) deleteUploadMutation.mutate(u.id) }}
                      className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {uploads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No uploads yet. <a href="/upload" className="text-green-700 hover:underline">Upload a pricelist</a></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
