import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function WordToPdf() {
  const [file, setFile]         = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a Word file')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/pdf/word-to-pdf', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('Converted to PDF!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Microsoft Word .docx files to PDF format. Free — no signup needed!"
      icon="📄"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/msword': ['.doc'],
            }}
            label="Drop your Word file here"
            hint=".docx or .doc files · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card p-4 border-green-500/20 bg-green-500/5">
                <p className="text-xs text-green-400 font-semibold mb-2">✅ Supported</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Text content & paragraphs</li>
                  <li>• Headings & structure</li>
                  <li>• Multi-page documents</li>
                  <li>• Standard formatting</li>
                </ul>
              </div>
              <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
                <p className="text-xs text-yellow-400 font-semibold mb-2">⚠️ Limited support</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Complex tables</li>
                  <li>• Images in document</li>
                  <li>• Custom fonts</li>
                  <li>• Headers/footers</li>
                </ul>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Converting Word to PDF..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Converting...' : '📄 Convert to PDF'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}