import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function PdfUnlock() {
  const [file, setFile]         = useState(null)
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')

    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',     file)
      form.append('password', password)

      const res = await api.post('/pdf/unlock', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('PDF unlocked!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null); setPassword('') }

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password protection from PDF files. Free — others charge ₹499/month!"
      icon="🔓"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your locked PDF here"
            hint="Password-protected PDF · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  PDF Password <span className="text-gray-600">(leave empty if no password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the PDF password"
                    className="input pr-12"
                  />
                  <button
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <span>ℹ️</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We only remove the password so you can open the file freely.
                  We never store your PDF or password on our servers.
                </p>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Unlocking PDF..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Unlocking...' : '🔓 Unlock PDF'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}