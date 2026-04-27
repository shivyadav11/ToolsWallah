import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function PdfWatermark() {
  const [file, setFile]         = useState(null)
  const [text, setText]         = useState('CONFIDENTIAL')
  const [opacity, setOpacity]   = useState(0.3)
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor]       = useState('#FF0000')
  const [rotation, setRotation] = useState(-45)
  const [position, setPosition] = useState('center')
  const [progress, setProgress] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file)        return toast.error('Select a PDF file')
    if (!text.trim()) return toast.error('Enter watermark text')

    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',     file)
      form.append('text',     text)
      form.append('opacity',  opacity)
      form.append('fontSize', fontSize)
      form.append('color',    color)
      form.append('rotation', rotation)
      form.append('position', position)

      const res = await api.post('/pdf/watermark', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('Watermark added!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  const POSITIONS = [
    { id: 'center',       label: '⊕ Center' },
    { id: 'bottom-center',label: '⬇ Bottom Center' },
    { id: 'bottom-right', label: '↘ Bottom Right' },
    { id: 'bottom-left',  label: '↙ Bottom Left' },
    { id: 'top-center',   label: '⬆ Top Center' },
    { id: 'top-right',    label: '↗ Top Right' },
  ]

  return (
    <ToolLayout
      title="PDF Watermark"
      description="Add custom text watermark to every page of your PDF. Free — iLovePDF charges for this!"
      icon="💧"
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
            <div className="card p-5 space-y-5">

              {/* Watermark text */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                  className="input"
                  maxLength={50}
                />
              </div>

              {/* Color + Opacity row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-gray-700 bg-gray-800"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="input flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Opacity: <span className="text-white font-bold">{Math.round(opacity * 100)}%</span>
                  </label>
                  <input
                    type="range" min="0.05" max="1" step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full mt-2 accent-brand-500"
                  />
                </div>
              </div>

              {/* Font size + Rotation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Font Size: <span className="text-white font-bold">{fontSize}px</span>
                  </label>
                  <input
                    type="range" min="10" max="100" step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-2 accent-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Rotation: <span className="text-white font-bold">{rotation}°</span>
                  </label>
                  <input
                    type="range" min="-90" max="90" step="5"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full mt-2 accent-brand-500"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`py-2 px-3 rounded-xl border text-xs transition-all
                        ${position === p.id
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview text */}
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <span
                  style={{
                    color,
                    opacity,
                    fontSize: `${Math.min(fontSize * 0.4, 32)}px`,
                    transform: `rotate(${rotation}deg)`,
                    display: 'inline-block',
                    fontWeight: 'bold',
                  }}
                >
                  {text || 'WATERMARK'}
                </span>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Adding watermark..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Adding Watermark...' : '💧 Add Watermark'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}