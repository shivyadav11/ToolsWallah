import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import api from '../../services/api'

export default function RepairPdf() {
  const [file, setFile]         = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/pdf/repair', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('PDF repaired successfully!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  const BASE_URL = 'http://localhost:5000'

  return (
    <ToolLayout
      title="Repair PDF"
      description="Fix corrupted or damaged PDF files and recover pages. Free — others charge ₹499/month!"
      icon="🔧"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your corrupted PDF here"
            hint="Damaged or corrupted PDF · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card p-4 border-green-500/20 bg-green-500/5">
                <p className="text-xs text-green-400 font-semibold mb-2">✅ Can fix</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Corrupted file structure</li>
                  <li>• Invalid PDF objects</li>
                  <li>• Encrypted/locked PDFs</li>
                  <li>• Metadata errors</li>
                  <li>• Oversized/bloated PDFs</li>
                </ul>
              </div>
              <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
                <p className="text-xs text-yellow-400 font-semibold mb-2">⚠️ Cannot fix</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Severely truncated files</li>
                  <li>• Files with 0 bytes</li>
                  <li>• Non-PDF files renamed .pdf</li>
                  <li>• Fully overwritten content</li>
                </ul>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Repairing PDF..." />

          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? '🔧 Repairing...' : '🔧 Repair PDF'}
          </button>
        </>
      ) : (
        <div className="space-y-4 animate-fade-up">
          {/* Success card */}
          <div className="card p-5 border-brand-600/30 bg-brand-500/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{result.message}</p>
                {result.repairs?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.repairs.map((r, i) => (
                      <span key={i} className="text-xs bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {result.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(result.stats).map(([key, val]) => (
                <div key={key} className="card p-3 text-center">
                  <div className="text-base font-bold text-brand-400">{val}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Download */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={result.downloadUrl?.startsWith('http') ? result.downloadUrl : `${BASE_URL}${result.downloadUrl}`}
              download={result.filename}
              className="btn-primary text-center text-sm"
            >
              ⬇️ Download Repaired PDF
            </a>
            <button onClick={reset} className="btn-secondary text-sm">
              🔄 Repair Another
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}