import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { compressPdf } from '../../services/api'

export default function PdfCompress() {
  const [file, setFile]         = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const res = await compressPdf(file, setProgress)
      setResult(res.data); toast.success('PDF compressed!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout title="Compress PDF" description="Reduce your PDF file size while preserving document quality." icon="🗜️">
      {!result ? (
        <>
          <FileDropzone onDrop={onDrop} accept={{ 'application/pdf': ['.pdf'] }} label="Drop your PDF here" hint="PDF only · Max 25MB" files={file ? [file] : []} />
          {file && (
            <div className="card p-4 flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <p className="text-sm text-gray-400">Your PDF will be compressed by removing metadata and optimizing internal structure.</p>
            </div>
          )}
          <ProgressBar progress={progress} label="Compressing PDF..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Compressing...' : '🗜️ Compress PDF'}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}