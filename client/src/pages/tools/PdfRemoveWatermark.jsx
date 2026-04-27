import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function PdfRemoveWatermark() {
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
      const res = await api.post('/pdf/remove-watermark', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('Watermark removed!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout
      title="Remove Watermark from PDF"
      description="Remove text and annotation watermarks from PDF files. Free — Adobe charges ₹1500/month!"
      icon="🧹"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your PDF here"
            hint="PDF with watermark · Max 25MB"
            files={file ? [file] : []}
          />

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4 border-green-500/20 bg-green-500/5">
              <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Works well on</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Text watermarks (CONFIDENTIAL, DRAFT)</li>
                <li>• Annotation-based watermarks</li>
                <li>• Watermarks added by ToolHub</li>
                <li>• Optional content layer watermarks</li>
                
              </ul>
            </div>
            <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Limited on</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Watermarks baked into page image</li>
                <li>• Scanned PDF watermarks</li>
                <li>• Encrypted/DRM protected PDFs</li>
                <li>• Watermarks merged with content</li>
              </ul>
            </div>
          </div>

          <ProgressBar progress={progress} label="Removing watermark..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Removing Watermark...' : '🧹 Remove Watermark'}
          </button>
        </>
      ) : (
        <>
          <ResultCard result={result} onReset={reset} />

          {/* Show note if image watermark */}
          {result.note && (
            <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-400 mb-1">Note</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{result.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {result.stats && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(result.stats).map(([key, val]) => (
                <div key={key} className="card p-4 text-center">
                  <div className="text-lg font-bold text-brand-400">{val}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{key}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}