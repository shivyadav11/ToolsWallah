import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function RemovePdfPages() {
  const [file, setFile]         = useState(null)
  const [pages, setPages]       = useState('')
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file)        return toast.error('Select a PDF file')
    if (!pages.trim()) return toast.error('Enter page numbers to remove')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',  file)
      form.append('pages', pages)
      const res = await api.post('/pdf/remove-pages', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('Pages removed successfully!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null); setPages('') }

  return (
    <ToolLayout
      title="Remove PDF Pages"
      description="Delete specific pages from any PDF file. Free — iLovePDF charges for this!"
      icon="🗑️"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your PDF here"
            hint="PDF only · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Pages to Remove <span className="text-gray-600">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="e.g. 1,3,5  or  2,4,6,8"
                  className="input"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Enter page numbers you want to <strong className="text-red-400">DELETE</strong> from the PDF.
                  Remaining pages will be saved.
                </p>
              </div>

              {/* Quick presets */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Remove page 1', value: '1' },
                    { label: 'Remove last page', value: 'last' },
                    { label: 'Remove pages 1,2', value: '1,2' },
                    { label: 'Remove odd pages', value: '1,3,5,7,9' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setPages(preset.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                        ${pages === preset.value
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <span>⚠️</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-red-400">Warning:</strong> Selected pages will be permanently deleted from the output PDF.
                  Original file is not modified.
                </p>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Removing pages..." />

          <button
            onClick={handle}
            disabled={!file || !pages.trim() || loading}
            className="btn-primary w-full"
            style={{ backgroundColor: !file || !pages.trim() || loading ? undefined : '#ef4444' }}
          >
            {loading ? 'Removing Pages...' : '🗑️ Remove Selected Pages'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}