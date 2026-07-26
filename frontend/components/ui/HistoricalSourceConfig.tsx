import { useState, useRef } from 'react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import { Database, FileText, UploadCloud, CheckCircle, AlertCircle, ChevronDown, ChevronUp, MapPin, Calendar, Gavel, Car, Layers } from 'lucide-react'
import { safeParseResponse, getApiBaseUrl } from '@/lib/api'

const FIELD_META: { key: string; label: string; icon: React.ElementType; description: string; required: boolean }[] = [
  { key: 'latitude', label: 'Latitude', icon: MapPin, description: 'GPS latitude coordinate', required: true },
  { key: 'longitude', label: 'Longitude', icon: MapPin, description: 'GPS longitude coordinate', required: true },
  { key: 'timestamp', label: 'Timestamp', icon: Calendar, description: 'Date/time of violation', required: false },
  { key: 'severity', label: 'Severity', icon: Gavel, description: 'Violation severity / penalty / fine amount', required: false },
  { key: 'violation_type', label: 'Violation Type', icon: Car, description: 'Type of parking violation', required: false },
  { key: 'zone', label: 'Zone / Area', icon: Layers, description: 'Parking zone or area name', required: false },
  { key: 'vehicle_type', label: 'Vehicle Type', icon: Car, description: 'Vehicle category', required: false },
  { key: 'road_segment_id', label: 'Road Segment ID', icon: MapPin, description: 'Road segment identifier', required: false },
]

export function HistoricalSourceConfig({ onComplete }: { onComplete: () => void }) {
  const { selectedSourceType, updateState } = useDataSourceStore()
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle'|'uploading'|'validated'|'error'>('idle')
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null)
  const [isLargeFile, setIsLargeFile] = useState(false)
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null)
  const [uploadedSizeMb, setUploadedSizeMb] = useState<number | null>(null)
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string | null>>({})
  const [userMapping, setUserMapping] = useState<Record<string, string>>({})
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const base = getApiBaseUrl()

  const handleSelect = (type: string) => {
    updateState({ selectedSourceType: type, status: 'selected' })
  }

  const handleStartFlipkart = async () => {
    updateState({ status: 'processing', sourceType: 'flipkart_dataset' })
    const res = await fetch(`${base}/api/static/load-flipkart`, { method: 'POST' })
    const result = await safeParseResponse(res)
    if (!result.ok) {
      updateState({ status: 'failed', error: result.error, sourceType: 'flipkart_dataset' })
    } else if (result.data.state?.status) {
      updateState(result.data.state)
    }
    onComplete()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadStatus('idle')
      setAvailableColumns([])
      setUploadError(null)
      setUploadHint(null)
      setShowTechnical(false)
      setTechnicalDetails(null)
      setIsLargeFile(false)
      setUploadedFilename(null)
      setUploadedSizeMb(null)
    }
  }

  const handleUploadAndValidate = async () => {
    if (!file) return
    setUploadStatus('uploading')
    setUploadError(null)
    setUploadHint(null)
    setTechnicalDetails(null)
    setShowTechnical(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${base}/api/static/upload-dataset`, {
        method: 'POST',
        body: formData
      })
      const result = await safeParseResponse(res)
      if (!result.ok) {
        setUploadStatus('error')
        setUploadError(result.error || 'Upload failed')
        setUploadHint(result.hint || null)
        setTechnicalDetails(
          result.rawText
            ? `Backend returned: ${result.rawText.substring(0, 500)}`
            : `HTTP ${result.httpStatus}: ${result.error}`
        )
        return
      }
      const data = result.data
      setAvailableColumns(data.columns || [])
      setUploadedFilename(data.original_filename || data.filename)
      setUploadedSizeMb(data.size_mb)
      setIsLargeFile(data.is_large || false)
      setPreviewRows(data.preview?.slice(0, 3) || [])
      const dm = data.detected_mapping || {}
      setDetectedMapping(dm)
      const initial: Record<string, string> = {}
      for (const f of FIELD_META) {
        if (dm[f.key]) initial[f.key] = dm[f.key]
      }
      setUserMapping(initial)
      setUploadStatus('validated')
    } catch (err: any) {
      setUploadStatus('error')
      setUploadError(err.message || 'Network error during upload')
      setTechnicalDetails(`Network error: ${err.message}`)
    }
  }

  const handleProcessUploaded = async () => {
    if (!file) return
    updateState({ status: 'processing', sourceType: 'csv_upload' })
    const mapping: Record<string, string> = {}
    for (const [key, val] of Object.entries(userMapping)) {
      if (val) mapping[key] = val
    }
    const res = await fetch(`${base}/api/static/process-dataset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: '', filename: file.name, mapping })
    })
    const result = await safeParseResponse(res)
    if (!result.ok) {
      updateState({ status: 'failed', error: result.error, sourceType: 'csv_upload' })
    } else if (result.data.state?.status) {
      updateState(result.data.state)
    }
    onComplete()
  }

  const options = [
    {
      id: 'flipkart_dataset',
      label: 'Use Flipkart Dataset',
      description: 'Run TRINETRA on the parking dataset already stored in the repository.',
      icon: FileText
    },
    {
      id: 'csv_upload',
      label: 'Upload CSV / Excel File',
      description: 'Upload your own parking violation dataset. TRINETRA will validate columns and run PICQ analysis.',
      icon: Database
    }
  ]

  const getConfidence = (fieldKey: string, selectedCol: string): { level: string; label: string } => {
    const auto = detectedMapping[fieldKey]
    if (!auto || !selectedCol) return { level: 'low', label: 'None' }
    const normField = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normCol = auto.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normCol === normField) return { level: 'high', label: 'High' }
    if (normCol.includes(normField) || normField.includes(normCol)) return { level: 'high', label: 'High' }
    if (auto !== selectedCol) return { level: 'medium', label: 'Manual' }
    const synonyms: Record<string, string[]> = {
      timestamp: ['date','time','datetime','violation_time','challan_time'],
      latitude: ['lat','gps_lat','y'],
      longitude: ['lon','lng','long','gps_lng','x'],
      violation_type: ['offence','offense','violation','challan'],
      zone: ['area','station','locality','beat','ward'],
      vehicle_type: ['vehicle','class'],
      severity: ['penalty','fine','weight','amount'],
    }
    const syns = synonyms[fieldKey] || []
    if (syns.some(s => normCol.includes(s) || s.includes(normCol))) return { level: 'high', label: 'High' }
    if (syns.some(s => normCol.includes(s.substring(0, 3)))) return { level: 'medium', label: 'Medium' }
    return { level: 'low', label: 'Low' }
  }

  return (
    <div className="flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
      <div className="mb-4 shrink-0">
        <h3 className="text-xl font-display font-bold text-warm-cream">Configure Historical Dataset</h3>
        <p className="text-sm text-white/50">Choose the stored Flipkart dataset or upload your own CSV/Excel file for PICQ analysis.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 pr-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
              selectedSourceType === opt.id 
                ? 'bg-electric-mint/10 border-electric-mint text-warm-cream opacity-100' 
                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 text-warm-cream'
            }`}
          >
            <div className={`p-2 rounded-xl mt-1 ${selectedSourceType === opt.id ? 'bg-electric-mint/20 text-electric-mint' : 'bg-white/10'}`}>
              <opt.icon size={20} />
            </div>
            <div>
              <h4 className="font-bold mb-1">{opt.label}</h4>
              <p className="text-sm text-white/50">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedSourceType === 'flipkart_dataset' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Selected Source Details</h4>
          <div className="bg-[#111312] border border-white/5 p-4 rounded-xl mb-4">
            <div className="text-sm text-white/70 mb-2"><strong>Source:</strong> Flipkart Dataset Repository</div>
            <div className="text-sm text-white/70"><strong>Purpose:</strong> Fastest path using stored segment data and PICQ scores.</div>
          </div>
          <button onClick={handleStartFlipkart} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Load Flipkart Dataset</button>
        </div>
      )}

      {selectedSourceType === 'csv_upload' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Selected Source Details</h4>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`bg-[#111312] border-2 border-dashed ${file ? 'border-electric-mint/50' : 'border-white/10'} hover:border-white/30 p-6 rounded-xl mb-4 text-center cursor-pointer transition-colors`}
          >
             <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
             />
             {!file ? (
                <div className="flex flex-col items-center gap-2">
                   <UploadCloud size={32} className="text-white/30" />
                   <div className="text-white/70 text-sm">Drag and drop or <span className="text-electric-mint underline">browse</span></div>
                   <div className="text-white/30 text-xs">Supports .csv, .xlsx, .xls</div>
                </div>
             ) : (
                <div className="flex flex-col items-center gap-2">
                   <FileText size={32} className="text-electric-mint" />
                   <div className="text-white text-sm font-bold">{file.name}</div>
                   <div className="text-white/50 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; {file.name.split('.').pop()?.toUpperCase()}</div>
                </div>
             )}
          </div>

          {isLargeFile && uploadStatus === 'validated' && (
            <div className="mb-4 p-3 bg-butter-yellow/10 border border-butter-yellow/30 rounded-lg flex items-start gap-2 text-butter-yellow text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>Large dataset detected ({uploadedSizeMb} MB). Processing may take 1–3 minutes.</div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mb-4 bg-coral-pink/10 border border-coral-pink/30 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start gap-2 text-coral-pink text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold mb-1">Dataset upload failed</div>
                  <div>{uploadError}</div>
                  {uploadHint && (
                    <div className="mt-1 text-xs text-coral-pink/70">{uploadHint}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="flex items-center gap-1.5 w-full px-4 py-2 text-xs text-white/40 hover:text-white/70 border-t border-coral-pink/20 transition-colors"
              >
                {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Technical Details
              </button>
              {showTechnical && technicalDetails && (
                <pre className="px-4 py-3 text-xs text-white/30 bg-black/20 max-h-32 overflow-y-auto border-t border-coral-pink/10 font-mono whitespace-pre-wrap">
                  {technicalDetails}
                </pre>
              )}
            </div>
          )}

          {uploadStatus === 'validated' && (
            <div className="mb-4 bg-electric-mint/5 border border-electric-mint/20 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center gap-2 text-electric-mint font-bold text-sm border-b border-electric-mint/10">
                <CheckCircle size={16} /> Dataset Validated ({availableColumns.length} columns)
              </div>
              <div className="p-3">
                <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Column Mapping</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-white/40 uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="text-left py-2 pr-2 font-medium">TRINETRA Field</th>
                        <th className="text-left py-2 px-2 font-medium">CSV Column</th>
                        <th className="text-left py-2 pl-2 font-medium w-[80px]">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FIELD_META.map(field => {
                        const conf = getConfidence(field.key, userMapping[field.key] || '')
                        return (
                        <tr key={field.key} className="border-b border-white/5 last:border-0">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-1.5">
                              <field.icon size={12} className={userMapping[field.key] ? 'text-electric-mint' : 'text-white/30'} />
                              <span className={userMapping[field.key] ? 'text-white font-medium' : 'text-white/40'}>{field.label}</span>
                              {field.required && <span className="text-coral-pink text-[9px]">*</span>}
                            </div>
                          </td>
                          <td className="py-2 pl-2">
                            <select
                              value={userMapping[field.key] || ''}
                              onChange={e => setUserMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className={`w-full bg-[#1a1d1b] border ${userMapping[field.key] ? 'border-electric-mint/40' : 'border-white/10'} rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-electric-mint transition-colors appearance-none cursor-pointer`}
                            >
                              <option value="">— None —</option>
                              {availableColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pl-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              conf.level === 'high' ? 'bg-electric-mint/10 text-electric-mint' :
                              conf.level === 'medium' ? 'bg-butter-yellow/10 text-butter-yellow' :
                              'bg-white/5 text-white/40'
                            }`}>{conf.label}</span>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[10px] text-white/30">
                    {userMapping.latitude && userMapping.longitude ? (
                      <span className="text-electric-mint/70">✓ Geo-coordinates mapped — segment derivation enabled</span>
                    ) : (
                      <span className="text-butter-yellow/70">⚠ Lat/Lon required for segment derivation</span>
                    )}
                  </div>
                  {previewRows.length > 0 && (
                    <div className="flex gap-1">
                      {previewRows.map((row, i) => (
                        <div key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/30">
                          {Object.entries(row).slice(0, 2).map(([k, v]) => `${k}: ${String(v).substring(0, 12)}`).join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-[#050706] pt-3 pb-1 flex gap-2">
            <button onClick={() => { useDataSourceStore.getState().updateState({ selectedSourceType: null, status: 'not_configured' }) }} 
              className="px-4 py-3 bg-white/5 text-white/70 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-colors text-sm">
              Back
            </button>
            {uploadStatus !== 'validated' ? (
                <button 
                   onClick={handleUploadAndValidate}
                   disabled={!file || uploadStatus === 'uploading'}
                   className={`flex-1 py-3 font-bold rounded-xl transition-colors border text-sm ${!file ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                   {uploadStatus === 'uploading' ? 'Uploading...' : 'Validate Dataset'}
                </button>
            ) : (
                <button 
                   onClick={handleProcessUploaded}
                   className="flex-1 py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors text-sm"
                >
                   Process with PICQ Engine
                </button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
