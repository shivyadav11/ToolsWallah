// =========================================================
//  pages/tools/BackgroundRemover.jsx
//  Pure React — runs entirely in browser (no backend)!
//  Install: npm install @imgly/background-removal
// =========================================================

import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'

export default function BackgroundRemover() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  

  const onDrop = (files) => {
    const f = files[0]
    setFile(f)
    setResult(null)
    setProgress(0)
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleRemove = async () => {
    if (!file) return toast.error('Select an image first')
    setLoading(true)
    setProgress(5)
    setProgressMsg('Loading AI model...')

    try {
      // Dynamically import to avoid crash if not installed
      let removeBackground
      try {
        ({ removeBackground } = await import('@imgly/background-removal'))
      } catch {
        toast.error('Install required: npm install @imgly/background-removal in client folder')
        setLoading(false)
        setProgress(0)
        return
      }

      setProgress(20)
      setProgressMsg('Analyzing image...')

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const pct = Math.round((current / total) * 60) + 20
          setProgress(Math.min(pct, 85))
          if (key === 'compute:inference') setProgressMsg('Removing background with AI...')
          else if (key === 'fetch:model')  setProgressMsg('Downloading AI model (first time only)...')
          else                             setProgressMsg('Processing...')
        },
        output: { format: 'image/png', quality: 1 },
      })

      setProgress(95)
      setProgressMsg('Finalizing...')

      const url = URL.createObjectURL(blob)
      setResult({ url, blob, filename: file.name.replace(/\.[^.]+$/, '') + '-no-bg.png' })
      setProgress(100)
      setProgressMsg('Done!')
      toast.success('Background removed!')

    } catch (error) {
      toast.error('Failed to remove background. Try a clearer image.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.filename
    link.click()
    toast.success('Image downloaded!')
  }

  const handleCopyImage = async () => {
    if (!result?.blob) return
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': result.blob })
      ])
      toast.success('Image copied to clipboard!')
    } catch {
      toast.error('Copy not supported — please download instead')
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setProgress(0)
    setProgressMsg('')
  }

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove image background with AI — completely free! Remove.bg charges ₹800/month. You get unlimited free."
      icon="🪄"
    >
      {/* Info banner */}
      <div className="card p-4 border-brand-600/30 bg-brand-500/5 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <p className="text-sm font-medium text-brand-400">100% Private — Runs in Your Browser</p>
          <p className="text-xs text-gray-400 mt-0.5">
            AI model runs locally. Your images never leave your device. No server upload needed!
          </p>
        </div>
      </div>

      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            label="Drop your image here"
            hint="JPG, PNG, WEBP · Works best with clear subject/background · Max 25MB"
            files={file ? [file] : []}
          />

          {/* Preview */}
          {preview && !loading && (
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-3">Original Image</p>
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-xl"
              />
            </div>
          )}

          {/* Progress */}
          {loading && (
            <div className="card p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-300">{progressMsg}</span>
                <span className="text-sm text-brand-400 font-mono font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress < 30 && (
                <p className="text-xs text-gray-500">
                  ⏳ First time: AI model downloads (~40MB). Subsequent uses are instant!
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleRemove}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? '🪄 Removing Background...' : '🪄 Remove Background'}
          </button>

          {/* Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card p-4 border-green-500/20 bg-green-500/5">
              <p className="text-xs text-green-400 font-semibold mb-2">✅ Best results with</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Clear subject with distinct background</li>
                <li>• People, products, animals</li>
                <li>• High contrast images</li>
                <li>• Good lighting</li>
              </ul>
            </div>
            <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs text-yellow-400 font-semibold mb-2">⚠️ May struggle with</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Hair with complex edges</li>
                <li>• Glass or transparent objects</li>
                <li>• Very busy backgrounds</li>
                <li>• Low-res images</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        /* Result */
        <div className="space-y-4 animate-fade-up">
          {/* Before / After */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-3">
              <p className="text-xs text-gray-500 mb-2 text-center">Before</p>
              <img src={preview} alt="Original" className="w-full max-h-48 object-contain rounded-lg" />
            </div>
            <div className="card p-3">
              <p className="text-xs text-gray-500 mb-2 text-center">After</p>
              <div
                className="w-full max-h-48 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#fff',
                }}
              >
                <img src={result.url} alt="No background" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Success message */}
          <div className="card p-4 border-brand-600/30 bg-brand-500/5 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium text-white">Background removed successfully!</p>
              <p className="text-xs text-gray-400 mt-0.5">PNG with transparent background ready to download</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownload} className="btn-primary text-sm">
              ⬇️ Download PNG
            </button>
            <button onClick={handleCopyImage} className="btn-secondary text-sm">
              📋 Copy Image
            </button>
          </div>
          <button onClick={reset} className="btn-secondary w-full text-sm">
            🔄 Remove Another Background
          </button>
        </div>
      )}
    </ToolLayout>
  )
}