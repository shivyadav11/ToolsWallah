import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { resizeImage } from '../../services/api'

export default function ImageResize() {
  const [file, setFile]         = useState(null)
  const [width, setWidth]       = useState('')
  const [height, setHeight]     = useState('')
  const [fit, setFit]           = useState('cover')
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Please select an image')
    if (!width && !height) return toast.error('Enter width or height')
    setLoading(true); setProgress(0)
    try {
      const res = await resizeImage(file, width || null, height || null, fit, setProgress)
      setResult(res.data); toast.success('Image resized!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout title="Resize Image" description="Resize images to any custom pixel dimensions." icon="📐">
      {!result ? (
        <>
          <FileDropzone onDrop={onDrop} accept={{ 'image/*': [] }} label="Drop your image here" hint="JPG, PNG, WEBP · Max 25MB" files={file ? [file] : []} />
          {file && (
            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Width (px)</label>
                  <input type="number" placeholder="e.g. 800" value={width} onChange={(e) => setWidth(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Height (px)</label>
                  <input type="number" placeholder="e.g. 600" value={height} onChange={(e) => setHeight(e.target.value)} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fit Mode</label>
                <select value={fit} onChange={(e) => setFit(e.target.value)} className="input">
                  <option value="cover">Cover (crop to fit)</option>
                  <option value="contain">Contain (letterbox)</option>
                  <option value="fill">Fill (stretch)</option>
                  <option value="inside">Inside (shrink only)</option>
                </select>
              </div>
            </div>
          )}
          <ProgressBar progress={progress} label="Resizing..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Resizing...' : '📐 Resize Image'}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}