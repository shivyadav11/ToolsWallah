import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { pdfToWord } from '../../services/api'

export default function PdfToWord() {
  const [file, setFile]         = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const res = await pdfToWord(file, setProgress)
      setResult(res.data); toast.success('Converted to Word!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout title="PDF to Word" description="Convert PDF documents to editable Microsoft Word (.docx) files." icon="📝">
      {!result ? (
        <>
          <FileDropzone onDrop={onDrop} accept={{ 'application/pdf': ['.pdf'] }} label="Drop your PDF here" hint="Text-based PDFs work best · Max 25MB" files={file ? [file] : []} />
          {file && (
            <div className="card p-4 flex items-center gap-3 border-yellow-500/30 bg-yellow-500/5">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm text-gray-400">Works best with text-based PDFs. Scanned image PDFs may not convert accurately.</p>
            </div>
          )}
          <ProgressBar progress={progress} label="Converting to Word..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Converting...' : '📝 Convert to Word'}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}