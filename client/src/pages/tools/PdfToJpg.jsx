import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import api from '../../services/api'

export default function PdfToJpg() {
  const [file, setFile]       = useState(null)
  const [quality, setQuality] = useState(90)
  const [page, setPage]       = useState('all')
  const [result, setResult]   = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',    file)
      form.append('quality', quality)
      form.append('page',    page)
      const res = await api.post('/pdf/to-jpg', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success(`${res.data.images?.length || 0} page(s) converted!`)
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout
      title="PDF to JPG"
      description="Convert each PDF page to a high-quality JPG image. Free — iLovePDF charges for this!"
      icon="🖼️"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your PDF here"
            hint="PDF only · Max 25MB · Up to 10 pages"
            files={file ? [file] : []}
          />

          {file && (
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pages to convert</label>
                <select value={page} onChange={(e) => setPage(e.target.value)} className="input">
                  <option value="all">All pages (max 10)</option>
                  <option value="1">Page 1 only</option>
                  <option value="1,2">Pages 1-2</option>
                  <option value="1,2,3">Pages 1-3</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">Or type custom pages: "1,3,5"</p>
                {page !== 'all' && !['1','1,2','1,2,3'].includes(page) && (
                  <input
                    type="text"
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="e.g. 1,3,5"
                    className="input mt-2"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Quality: <span className="text-white font-bold">{quality}%</span>
                </label>
                <input type="range" min="50" max="100" step="5"
                  value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-brand-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Smaller file</span><span>Best quality</span>
                </div>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Converting PDF pages to JPG..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Converting...' : '🖼️ Convert to JPG'}
          </button>
        </>
      ) : (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-4 border-brand-600/30 bg-brand-500/5">
            <p className="text-sm font-medium text-white">{result.message}</p>
            <p className="text-xs text-gray-500 mt-1">Total pages in PDF: {result.totalPages}</p>
          </div>

          <div className="space-y-3">
            {result.images?.map((img, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                  {img.page}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200 font-medium">Page {img.page}</p>
                  <p className="text-xs text-gray-500 truncate">{img.filename}</p>
                  {img.note && <p className="text-xs text-yellow-400 mt-0.5">{img.note}</p>}
                </div>
                <a
                  href={img.downloadUrl}
                  download={img.filename}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  ⬇️ Download
                </a>
              </div>
            ))}
          </div>

          {result.fallback && (
            <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs text-yellow-400">
                💡 Install <code className="bg-gray-800 px-1 rounded">pdf2pic</code> on server for actual JPG output.
                Currently extracting as PDF pages.
              </p>
            </div>
          )}

          <button onClick={reset} className="btn-secondary w-full">🔄 Convert Another</button>
        </div>
      )}
    </ToolLayout>
  )
}