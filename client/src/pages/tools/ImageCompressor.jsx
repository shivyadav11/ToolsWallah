import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { compressImage } from '../../services/api'

export default function ImageCompressor() {
  const [file, setFile]         = useState(null)
  const [quality, setQuality]   = useState(80)
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0])
    setResult(null)
  }

  const handleCompress = async () => {
    if (!file) return toast.error('Please select an image first')
    setLoading(true)
    setProgress(0)
    try {
      const res = await compressImage(file, quality, setProgress)
      setResult(res.data)
      toast.success('Image compressed successfully!')
    } catch  {
      // error shown by interceptor
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout
      title="Compress Image"
      description="Reduce image file size without losing visible quality. Supports JPG, PNG, WEBP."
      icon="📸"
    >
      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            label="Drop your image here"
            hint="Supports JPG, PNG, WEBP · Max 25MB"
            files={file ? [file] : []}
          />

          {file && (
            <div className="card p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Quality: <span className="text-brand-400 font-bold">{quality}%</span>
              </label>
              <input
                type="range" min="10" max="100" step="5"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Compressing image..." />

          <button
            onClick={handleCompress}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Compressing...' : '🗜️ Compress Image'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}