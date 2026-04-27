import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { splitPdf } from '../../services/api'

export default function PdfSplit() {
  const [file, setFile]         = useState(null)
  const [pages, setPages]       = useState('')
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const res = await splitPdf(file, pages || null, setProgress)
      setResult(res.data); toast.success('PDF split!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null); setPages('') }

  return (
    <ToolLayout title="Split PDF" description="Extract specific pages or a range from your PDF." icon="✂️">
      {!result ? (
        <>
          <FileDropzone onDrop={onDrop} accept={{ 'application/pdf': ['.pdf'] }} label="Drop your PDF here" hint="PDF only · Max 25MB" files={file ? [file] : []} />
          {file && (
            <div className="card p-5">
              <label className="block text-sm text-gray-400 mb-1">Pages to extract <span className="text-gray-600">(leave empty for all)</span></label>
              <input type="text" placeholder='e.g.  "1,3,5"  or  "2-8"' value={pages} onChange={(e) => setPages(e.target.value)} className="input" />
              <p className="text-xs text-gray-600 mt-2">Use commas for specific pages: 1,3,5 · Use hyphen for range: 2-8</p>
            </div>
          )}
          <ProgressBar progress={progress} label="Splitting PDF..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Splitting...' : '✂️ Split PDF'}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}