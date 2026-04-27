import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import ResultCard from '../../components/ResultCard'
import api from '../../services/api'

export default function PdfPageNumbers() {
  const [file, setFile]           = useState(null)
  const [position, setPosition]   = useState('bottom-center')
  const [startFrom, setStartFrom] = useState(1)
  const [format, setFormat]       = useState('Page {n} of {total}')
  const [fontSize, setFontSize]   = useState(11)
  const [color, setColor]         = useState('#000000')
  const [progress, setProgress]   = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Select a PDF file')

    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file',      file)
      form.append('position',  position)
      form.append('startFrom', startFrom)
      form.append('format',    format)
      form.append('fontSize',  fontSize)
      form.append('color',     color)

      const res = await api.post('/pdf/page-numbers', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data)
      toast.success('Page numbers added!')
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null) }

  const POSITIONS = [
    { id: 'bottom-center', label: '⬇️ Bottom Center' },
    { id: 'bottom-right',  label: '↘️ Bottom Right' },
    { id: 'bottom-left',   label: '↙️ Bottom Left' },
    { id: 'top-center',    label: '⬆️ Top Center' },
    { id: 'top-right',     label: '↗️ Top Right' },
    { id: 'top-left',      label: '↖️ Top Left' },
  ]

  const FORMAT_PRESETS = [
    'Page {n} of {total}',
    '{n}',
    '{n} / {total}',
    '- {n} -',
    'Page {n}',
  ]

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Add page numbers to every page of your PDF. Customize position, format and style. Free!"
      icon="🔢"
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

              {/* Format presets */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Number Format</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {FORMAT_PRESETS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all
                        ${format === f
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {f.replace('{n}', '1').replace('{total}', '5')}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="input font-mono text-sm"
                  placeholder="Custom: use {n} for page number, {total} for total"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Use <code className="text-brand-400">{'{n}'}</code> for current page, <code className="text-brand-400">{'{total}'}</code> for total pages
                </p>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`py-2 px-2 rounded-xl border text-xs transition-all
                        ${position === p.id
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start from + Font size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start From Page</label>
                  <input
                    type="number" min="1" max="999"
                    value={startFrom}
                    onChange={(e) => setStartFrom(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Font Size: <span className="text-white font-bold">{fontSize}px</span>
                  </label>
                  <input
                    type="range" min="6" max="24" step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-3 accent-brand-500"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-700 bg-gray-800"
                  />
                  <span className="font-mono text-sm text-gray-300">{color}</span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2 text-center">Preview</p>
                <div className="bg-white rounded-lg p-4 relative min-h-[80px] flex items-center justify-center">
                  <span
                    style={{ color, fontSize: `${fontSize * 1.5}px`, fontFamily: 'Helvetica, Arial, sans-serif' }}
                    className="opacity-85"
                  >
                    {format.replace('{n}', startFrom).replace('{total}', '?')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ProgressBar progress={progress} label="Adding page numbers..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Adding Numbers...' : '🔢 Add Page Numbers'}
          </button>
        </>
      ) : (
        <ResultCard result={result} onReset={reset} />
      )}
    </ToolLayout>
  )
}