import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import api from '../../services/api'

export default function PdfToText() {
  const [file, setFile]     = useState(null)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/ocr/pdf-to-text', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data.data)
      toast.success('Text extracted!')
    } catch {
      // error shown by interceptor
    } finally { setLoading(false); setProgress(null) }
  }

  const copyText     = () => { navigator.clipboard.writeText(result?.text || ''); toast.success('Copied!') }
  const downloadText = () => {
    const blob = new Blob([result?.text || ''], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = `pdf-text-${Date.now()}.txt`
    link.href = URL.createObjectURL(blob)
    link.click()
    toast.success('Downloaded!')
  }
  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout
      title="PDF to Text (OCR)"
      description="Extract all text from PDF files instantly. Works on text-based PDFs. Free forever!"
      icon="📄🔤"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your PDF here"
            hint="Text-based PDFs work best · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4 border-green-500/20 bg-green-500/5">
                <p className="text-xs text-green-400 font-semibold mb-2">✅ Works on</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Word converted PDFs</li>
                  <li>• Digital text PDFs</li>
                  <li>• Reports, invoices</li>
                  <li>• Ebooks, articles</li>
                </ul>
              </div>
              <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
                <p className="text-xs text-yellow-400 font-semibold mb-2">⚠️ Use Image to Text for</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Scanned PDFs</li>
                  <li>• Photo PDFs</li>
                  <li>• Handwritten PDFs</li>
                  <li>• Image-only PDFs</li>
                </ul>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Extracting text from PDF..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? '📄 Extracting...' : '📄 Extract Text from PDF'}
          </button>
        </>
      ) : (
        <div className="space-y-4 animate-fade-up">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pages',      value: result.pages     || 0 },
              { label: 'Words',      value: result.wordCount || 0 },
              { label: 'Characters', value: result.characters || 0 },
            ].map((s) => (
              <div key={s.label} className="card p-3 text-center">
                <div className="text-xl font-bold text-brand-400">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Text output */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Extracted Text</span>
              <div className="flex gap-2">
                <button onClick={copyText}     className="btn-secondary text-xs py-1.5 px-3">📋 Copy</button>
                <button onClick={downloadText} className="btn-secondary text-xs py-1.5 px-3">⬇️ .txt</button>
              </div>
            </div>
            {result.text ? (
              <textarea
                readOnly
                value={result.text}
                rows={14}
                className="input resize-none font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📄</p>
                <p className="text-gray-400 text-sm">{result.message}</p>
                <p className="text-xs text-gray-500 mt-2">Try the "Image to Text" tool for scanned PDFs</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {result.text && <button onClick={copyText} className="btn-primary text-sm">📋 Copy All</button>}
            <button onClick={reset} className={`btn-secondary text-sm ${!result.text ? 'col-span-2' : ''}`}>
              🔄 Try Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}