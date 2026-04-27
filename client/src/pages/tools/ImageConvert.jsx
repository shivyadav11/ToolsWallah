import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import { convertImage } from '../../services/api'

export default function ImageConvert() {
  const [file, setFile]         = useState(null)
  const [format, setFormat]     = useState('jpeg')
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Please select an image')
    setLoading(true); setProgress(0)
    try {
      const res = await convertImage(file, format, setProgress)
      setResult(res.data); toast.success('Image converted!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  return (
    <ToolLayout title="Convert Image" description="Convert images between JPG, PNG, and WEBP formats instantly." icon="🔄">
      {!result ? (
        <>
          <FileDropzone onDrop={onDrop} accept={{ 'image/*': [] }} label="Drop your image here" hint="JPG, PNG, WEBP, GIF · Max 25MB" files={file ? [file] : []} />
          {file && (
            <div className="card p-5">
              <label className="block text-sm text-gray-400 mb-2">Convert to format</label>
              <div className="grid grid-cols-3 gap-3">
                {['jpeg', 'png', 'webp'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-3 rounded-xl border font-mono font-bold text-sm uppercase transition-all
                      ${format === fmt ? 'bg-brand-500 border-brand-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ProgressBar progress={progress} label="Converting..." />
          <button onClick={handle} disabled={!file || loading} className="btn-primary w-full">
            {loading ? 'Converting...' : `🔄 Convert to ${format.toUpperCase()}`}
          </button>
        </>
      ) : <ResultCard result={result} onReset={reset} />}
    </ToolLayout>
  )
}