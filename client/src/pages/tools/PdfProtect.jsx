import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function PdfProtect() {
  const [file, setFile]             = useState(null)
  const [password, setPassword]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [progress, setProgress]     = useState(null)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file)              return toast.error('Select a PDF file')
    if (!password)          return toast.error('Enter a password')
    if (password.length < 4) return toast.error('Password must be at least 4 characters')
    if (password !== confirmPwd) return toast.error('Passwords do not match!')

    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',          file)
      form.append('userPassword',  password)
      form.append('ownerPassword', password + '_owner')

      const res = await api.post('/pdf/protect', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('PDF protected!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null); setPassword(''); setConfirmPwd('') }

  // Password strength
  const getStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6)  return { label: 'Weak',   color: '#ef4444' }
    if (pwd.length < 10) return { label: 'Medium', color: '#f59e0b' }
    return { label: 'Strong', color: '#25a36e' }
  }
  const strength = getStrength(password)

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF files. Free — Adobe charges ₹1500/month for this!"
      icon="🔐"
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

              {/* Password field */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Set Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="input pr-12"
                  />
                  <button
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {strength && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%',
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter password"
                  className="input"
                />
                {confirmPwd && password !== confirmPwd && (
                  <p className="text-xs text-red-400 mt-1">❌ Passwords do not match</p>
                )}
                {confirmPwd && password === confirmPwd && (
                  <p className="text-xs text-brand-400 mt-1">✅ Passwords match</p>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <span className="text-lg">⚠️</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-yellow-400">Important:</strong> Save your password safely.
                  If you forget it, the PDF cannot be recovered — even by us.
                </p>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Protecting PDF..." />

          <button
            onClick={handle}
            disabled={!file || loading || !password || password !== confirmPwd}
            className="btn-primary w-full"
          >
            {loading ? 'Protecting...' : '🔐 Protect PDF'}
          </button>
        </>
      ) : (
        <>
          <ResultCard result={result} onReset={reset} />
          {result.password && (
            <div className="card p-4 border-brand-600/30 bg-brand-500/5 text-center">
              <p className="text-xs text-gray-400 mb-1">Your password</p>
              <p className="font-mono text-lg font-bold text-brand-400">{result.password}</p>
              <p className="text-xs text-gray-600 mt-1">Save this — you will need it to open the PDF</p>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}