import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { jpgToPdf } from '../../services/api'

export default function JpgToPdf() {
  const [files, setFiles]       = useState([])
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFiles((prev) => [...prev, ...f]); setResult(null) }
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handle = async () => {
    if (files.length === 0) return toast.error('Select at least 1 image')
    setLoading(true); setProgress(0)
    try {
      const res = await jpgToPdf(files, setProgress)
      setResult(res.data); toast.success('Converted to PDF!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFiles([]); setResult(null) }

  return (
    <ToolLayout title="JPG to PDF" description="Convert one or multiple images into a single PDF document." icon="🖼️">
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            multiple
            label="Drop images here"
            hint="JPG, PNG, WEBP · Each image becomes one page · Max 25MB each"
            files={[]}
          />

          {files.length > 0 && (
            <div className="card p-4 space-y-2">
              <p className="text-sm text-gray-400 mb-2">{files.length} image(s) — each will become 1 page:</p>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
                  <span className="text-gray-500 font-mono text-sm w-6">{i + 1}.</span>
                  <span className="text-lg">🖼️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{f.name}</p>
                    <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}

          <ProgressBar progress={progress} label="Converting to PDF..." />
          <button onClick={handle} disabled={files.length === 0 || loading} className="btn-primary w-full">
            {loading ? 'Converting...' : `🖼️ Convert ${files.length} Image${files.length !== 1 ? 's' : ''} to PDF`}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}