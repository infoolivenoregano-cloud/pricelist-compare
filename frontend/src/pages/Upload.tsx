import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { getDistributors, previewUpload, confirmUpload, type ExcelPreview, type ColumnMapping } from '../api/client'

type Step = 'select' | 'map' | 'done'

export default function Upload() {
  const qc = useQueryClient()
  const [step, setStep] = useState<Step>('select')
  const [distributorId, setDistributorId] = useState<number | ''>('')
  const [weekDate, setWeekDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExcelPreview | null>(null)
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [headerRow, setHeaderRow] = useState(0)
  const [result, setResult] = useState<{ item_count: number; distributor_name: string } | null>(null)
  const [error, setError] = useState<string>('')

  const { data: distributors = [] } = useQuery({
    queryKey: ['distributors'],
    queryFn: getDistributors,
  })

  const previewMutation = useMutation({
    mutationFn: (fd: FormData) => previewUpload(fd),
    onSuccess: (data) => {
      setPreview(data)
      if (data.existing_mapping) {
        setMapping(data.existing_mapping)
        setSelectedSheet(data.existing_mapping.sheet_name || data.sheets[0] || '')
        setHeaderRow(data.existing_mapping.header_row ?? 0)
      } else {
        setSelectedSheet(data.sheets[0] || '')
        setHeaderRow(0)
        setMapping({})
      }
      setStep('map')
    },
    onError: (e: Error) => setError(e.message),
  })

  const confirmMutation = useMutation({
    mutationFn: (fd: FormData) => confirmUpload(fd),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['uploads'] })
      qc.invalidateQueries({ queryKey: ['compare'] })
      setResult({ item_count: data.item_count, distributor_name: data.distributor_name })
      setStep('done')
    },
    onError: (e: Error) => setError(e.message),
  })

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setError('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  function handlePreview() {
    if (!file || !distributorId) {
      setError('Select a distributor and a file.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('distributor_id', String(distributorId))
    fd.append('header_row', String(headerRow))
    if (selectedSheet) fd.append('sheet_name', selectedSheet)
    previewMutation.mutate(fd)
  }

  function handleConfirm() {
    if (!file || !distributorId || !mapping.name_column || !mapping.price_column) {
      setError('Name column and Price column are required.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('distributor_id', String(distributorId))
    fd.append('week_date', weekDate)
    fd.append('mapping_json', JSON.stringify({
      ...mapping,
      distributor_id: distributorId,
      header_row: headerRow,
      sheet_name: selectedSheet || null,
    }))
    confirmMutation.mutate(fd)
  }

  function reset() {
    setStep('select')
    setFile(null)
    setPreview(null)
    setMapping({})
    setResult(null)
    setError('')
  }

  const colOpts = preview?.columns || []

  function ColSelect({ field, label, required }: { field: keyof ColumnMapping; label: string; required?: boolean }) {
    return (
      <div>
        <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <select
          className="input"
          value={(mapping[field] as string) || ''}
          onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
        >
          <option value="">— skip —</option>
          {colOpts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold mb-6">Upload Pricelist</h1>

      {step === 'done' && result && (
        <div className="card p-8 text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-1">Upload Complete</h2>
          <p className="text-gray-600 mb-6">
            {result.item_count} items imported from <strong>{result.distributor_name}</strong>
          </p>
          <div className="flex gap-3 justify-center">
            <button className="btn-secondary" onClick={reset}>Upload Another</button>
            <a href="/" className="btn-primary">View Comparison</a>
          </div>
        </div>
      )}

      {step !== 'done' && (
        <div className="card p-6 space-y-6">
          {/* Step 1: Select */}
          <section>
            <h2 className="font-semibold text-gray-800 mb-4">1. Distributor &amp; Date</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Distributor<span className="text-red-500 ml-0.5">*</span></label>
                <select
                  className="input"
                  value={distributorId}
                  onChange={e => setDistributorId(Number(e.target.value))}
                >
                  <option value="">Select distributor…</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Pricelist Date<span className="text-red-500 ml-0.5">*</span></label>
                <input type="date" className="input" value={weekDate} onChange={e => setWeekDate(e.target.value)} />
              </div>
            </div>
          </section>

          {/* File drop */}
          <section>
            <h2 className="font-semibold text-gray-800 mb-4">2. Upload File</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <UploadIcon size={32} className="mx-auto mb-3 text-gray-400" />
              {file ? (
                <p className="text-green-700 font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="font-medium text-gray-700">Drop Excel file here or click to browse</p>
                  <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                </>
              )}
            </div>

            {file && step === 'select' && (
              <button
                className="btn-primary mt-4 w-full"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Parsing…' : 'Next: Map Columns →'}
              </button>
            )}
          </section>

          {/* Step 2: Column mapping */}
          {step === 'map' && preview && (
            <section>
              <h2 className="font-semibold text-gray-800 mb-1">3. Map Columns</h2>
              <p className="text-sm text-gray-500 mb-4">
                {preview.existing_mapping ? 'Saved mapping loaded — verify or adjust.' : 'Tell us which columns contain which data.'}
              </p>

              {preview.sheets.length > 1 && (
                <div className="mb-4">
                  <label className="label">Sheet</label>
                  <select className="input" value={selectedSheet} onChange={e => {
                    setSelectedSheet(e.target.value)
                    // Re-preview with new sheet
                    if (file && distributorId) {
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('distributor_id', String(distributorId))
                      fd.append('header_row', String(headerRow))
                      fd.append('sheet_name', e.target.value)
                      previewMutation.mutate(fd)
                    }
                  }}>
                    {preview.sheets.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="label">Header Row (0 = first row)</label>
                <input
                  type="number"
                  className="input w-24"
                  min={0}
                  max={20}
                  value={headerRow}
                  onChange={e => setHeaderRow(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <ColSelect field="name_column" label="Item Name" required />
                <ColSelect field="price_column" label="Price" required />
                <ColSelect field="sku_column" label="SKU / Item #" />
                <ColSelect field="pack_size_column" label="Pack Size" />
                <ColSelect field="unit_column" label="Unit of Measure" />
                <ColSelect field="notes_column" label="Notes / Brand" />
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
                <table className="text-xs w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      {preview.columns.map(c => (
                        <th key={c} className="px-2 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {preview.columns.map(c => (
                          <td key={c} className="px-2 py-1.5 text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                            {row[c] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary" onClick={() => setStep('select')}>← Back</button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending || !mapping.name_column || !mapping.price_column}
                >
                  {confirmMutation.isPending ? 'Importing…' : 'Import Pricelist'}
                </button>
              </div>
            </section>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
