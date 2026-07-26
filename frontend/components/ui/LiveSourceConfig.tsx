import { useState, useRef } from 'react'
import { useDataSourceStore } from '@/store/useDataSourceStore'
import { Network, CloudRain, Video, Server, PlayCircle, FileText, UploadCloud, AlertCircle } from 'lucide-react'
import { safeParseResponse, getApiBaseUrl } from '@/lib/api'

export function LiveSourceConfig({ onComplete }: { onComplete: () => void }) {
  const { selectedSourceType, updateState } = useDataSourceStore()
  const base = getApiBaseUrl()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [backendPath, setBackendPath] = useState('')
  const [pollInterval, setPollInterval] = useState(5)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (type: string) => {
    updateState({ selectedSourceType: type, status: 'selected' })
  }

  const handleStart = async (endpoint: string, body: any = {}) => {
    updateState({ status: 'connecting', sourceType: selectedSourceType || 'demo_stream' })
    
    try {
      if (endpoint) {
        const res = await fetch(`${base}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const result = await safeParseResponse(res)
        if (!result.ok) {
          updateState({ status: 'failed', error: result.error })
          return
        }
        const data = result.data
        if (data.state) {
          updateState(data.state)
        } else {
          updateState({ status: 'connected' })
        }
      }
      onComplete()
    } catch (err: any) {
      updateState({ status: 'failed', error: err.message })
    }
  }

  const options = [
    {
      id: 'csv_polling',
      label: 'Near-real-time CSV / Excel Polling',
      description: 'Poll a file periodically for newly appended violation rows.',
      icon: FileText
    },
    {
      id: 'rest_api',
      label: 'REST API Polling',
      description: 'Poll an external API endpoint for new parking violation events.',
      icon: Server
    },
    {
      id: 'websocket',
      label: 'WebSocket Stream',
      description: 'Connect to a live WebSocket source emitting parking events.',
      icon: CloudRain
    },
    {
      id: 'kafka_yolo',
      label: 'CCTV / YOLO Event Feed via Kafka',
      description: 'Consume illegal-parking detection events produced by CCTV/YOLO pipelines.',
      icon: Video
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4">
        <h3 className="text-xl font-display font-bold text-warm-cream">Configure Live Data Source</h3>
        <p className="text-sm text-white/50">Choose a near-real-time or streaming source for dynamic PICQ updates.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
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

      {selectedSourceType === 'csv_polling' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">CSV / Excel Polling Configuration</h4>
          <div className="text-[11px] text-white/40 mb-3 px-1">Browser uploads a snapshot of the file. For true polling of a local path, run backend with file path access.</div>

          {uploadError && (
            <div className="mb-3 p-3 bg-coral-pink/10 border border-coral-pink/30 rounded-xl flex items-start gap-2 text-coral-pink text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>{uploadError}</div>
            </div>
          )}

          <div className="bg-[#111312] border border-white/5 p-4 rounded-xl mb-4 space-y-4">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Option 1: Upload File Snapshot (Simulated Polling)</label>
              <div onClick={() => fileInputRef.current?.click()}
                className={`bg-deep-black border-2 border-dashed ${csvFile ? 'border-electric-mint/50' : 'border-white/10'} hover:border-white/30 rounded-xl p-4 text-center cursor-pointer transition-colors`}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={e => { if (e.target.files?.[0]) { setCsvFile(e.target.files[0]); setUploadError(null) }}} />
                {!csvFile ? (
                  <div className="flex flex-col items-center gap-1">
                    <UploadCloud size={24} className="text-white/30" />
                    <span className="text-white/50 text-sm">Drop file or <span className="text-electric-mint underline">browse</span></span>
                    <span className="text-white/20 text-[10px]">.csv, .xlsx, .xls</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <FileText size={24} className="text-electric-mint" />
                    <span className="text-white text-sm font-bold">{csvFile.name}</span>
                    <span className="text-white/40 text-[10px]">{(csvFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Option 2: Backend File Path (True Polling)</label>
              <input type="text" value={backendPath} onChange={e => setBackendPath(e.target.value)} placeholder="/data/parking_logs.csv" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white placeholder-white/30" />
            </div>

            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Poll Interval (seconds)</label>
              <input type="number" value={pollInterval} onChange={e => setPollInterval(Math.max(1, Number(e.target.value)))} className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" min="1" />
            </div>
          </div>

          <button onClick={async () => {
            if (!csvFile && !backendPath) { setUploadError('Select a file or enter a backend path.'); return }
            setUploadingFile(true); setUploadError(null)
            try {
              let uploadedFilename = backendPath || csvFile?.name
              if (csvFile && !backendPath) {
                const fd = new FormData(); fd.append('file', csvFile)
                const uploadRes = await fetch(`${base}/api/static/upload-dataset`, { method: 'POST', body: fd })
                const uploadResult = await safeParseResponse(uploadRes)
                if (!uploadResult.ok) { setUploadError(uploadResult.error || 'Upload failed'); setUploadingFile(false); return }
                uploadedFilename = uploadResult.data?.filename || csvFile.name
              }
              await handleStart('/api/live/start-file-polling', { source_type: 'csv_polling', poll_interval: pollInterval, file_path: uploadedFilename })
            } catch (err: any) { setUploadError(err.message) }
            setUploadingFile(false)
          }} disabled={uploadingFile} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            {uploadingFile ? 'Uploading...' : 'Start File Polling'}
          </button>
        </div>
      )}

      {selectedSourceType === 'rest_api' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Selected Source Details</h4>
          <div className="bg-[#111312] border border-white/5 p-4 rounded-xl mb-4 space-y-3">
             <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Endpoint URL</label>
                <input type="url" placeholder="https://api.example.com/events" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
             </div>
             <div className="flex gap-3">
                <div className="flex-1">
                   <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Poll Interval (s)</label>
                   <input type="number" defaultValue="10" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
                <div className="flex-1">
                   <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Auth Token (Optional)</label>
                   <input type="password" placeholder="Bearer..." className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
             </div>
          </div>
          <button onClick={() => handleStart('/api/live/start-api-polling', { source_type: 'rest_api' })} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Start API Polling</button>
        </div>
      )}

      {selectedSourceType === 'websocket' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Selected Source Details</h4>
          <div className="bg-[#111312] border border-white/5 p-4 rounded-xl mb-4 space-y-3">
             <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">WebSocket URL</label>
                <input type="url" placeholder="wss://stream.example.com" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
             </div>
             <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Auth Token (Optional)</label>
                <input type="password" placeholder="Token..." className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
             </div>
          </div>
          <button onClick={() => handleStart('/api/live/connect-websocket', { source_type: 'websocket' })} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Connect WebSocket</button>
        </div>
      )}

      {selectedSourceType === 'kafka_yolo' && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Selected Source Details</h4>
          <div className="bg-[#111312] border border-white/5 p-4 rounded-xl mb-4 space-y-3">
             <div>
                <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Kafka Broker URL</label>
                <input type="text" placeholder="kafka.internal:9092" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
             </div>
             <div className="flex gap-3">
                <div className="flex-1">
                   <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Topic Name</label>
                   <input type="text" placeholder="yolo-detections" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
                <div className="flex-1">
                   <label className="text-xs text-white/50 uppercase tracking-widest block mb-1">Consumer Group</label>
                   <input type="text" defaultValue="trinetra-live-01" className="w-full bg-deep-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                </div>
             </div>
          </div>
          <button onClick={() => handleStart('/api/live/connect-kafka-yolo', { source_type: 'kafka_yolo' })} className="w-full py-3 bg-electric-mint text-deep-black font-bold rounded-xl hover:bg-white transition-colors">Connect Kafka Feed</button>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-white/10">
         <button 
           onClick={() => {
              updateState({ selectedSourceType: 'demo_stream' })
              handleStart('/api/live/start-demo-stream', { source_type: 'demo_stream' })
           }}
           className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white rounded-xl transition-colors font-bold text-sm uppercase tracking-widest"
         >
           <PlayCircle size={18} /> Start Demo Live Stream
         </button>
      </div>

    </div>
  )
}
