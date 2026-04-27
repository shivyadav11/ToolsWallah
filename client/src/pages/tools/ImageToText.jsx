import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'

// Load Tesseract.js from CDN
const loadTesseract = () => new Promise((resolve, reject) => {
  if (window.Tesseract) { resolve(window.Tesseract); return }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
  s.onload  = () => resolve(window.Tesseract)
  s.onerror = () => reject(new Error('Failed to load Tesseract'))
  document.head.appendChild(s)
})

const LANGUAGES = [
  { code: 'eng',     label: '🇺🇸 English' },
  { code: 'hin',     label: '🇮🇳 Hindi' },
  { code: 'eng+hin', label: '🇮🇳 English + Hindi' },
  { code: 'fra',     label: '🇫🇷 French' },
  { code: 'deu',     label: '🇩🇪 German' },
  { code: 'spa',     label: '🇪🇸 Spanish' },
]

export default function ImageToText() {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [lang, setLang]       = useState('eng')
  const [result, setResult]   = useState('')
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  const onDrop = useCallback((files) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult('')
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'] },
    multiple: false,
  })

  const extract = async () => {
    if (!file) return toast.error('Upload an image first')

    setLoading(true)
    setProgress(0)
    setResult('')

    try {
      const Tesseract = await loadTesseract()

      const worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const cleaned = text.trim()
      if (!cleaned) {
        toast.error('No text found. Try a clearer image.')
      } else {
        setResult(cleaned)
        toast.success(`Text extracted! (${cleaned.split(/\s+/).length} words)`)
      }
    } catch (e) {
      toast.error('OCR failed. Try a clearer image.')
      console.error(e)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Text copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([result], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `extracted-text-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Text file downloaded!')
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult('')
    setProgress(null)
  }

  return (
    <ToolLayout
      title="Image to Text (OCR)"
      description="Extract text from any image — screenshots, photos, scanned documents. Supports Hindi & English. Free!"
      icon="🔤"
    >
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="w-full">
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain mb-3" />
            <p className="text-sm text-gray-400">{file?.name}</p>
            <p className="text-xs text-gray-600 mt-1">Click to change image</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">{isDragActive ? '📂' : '🖼️'}</div>
            <p className="text-gray-300 font-medium">Drop your image here</p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG, WEBP, BMP · Max 25MB</p>
          </>
        )}
      </div>

      {/* Language selector */}
      <div className="card p-5">
        <label className="block text-sm text-gray-400 mb-3 font-medium">
          Language in image
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all
                ${lang === l.code
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {loading && progress !== null && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-300 font-medium">
              {progress < 10 ? 'Loading OCR engine...' : 'Extracting text...'}
            </span>
            <span className="text-sm text-brand-400 font-mono font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            First run downloads language model (~5MB). Subsequent runs are faster.
          </p>
        </div>
      )}

      {/* Extract button */}
      <button
        onClick={extract}
        disabled={!file || loading}
        className="btn-primary w-full"
      >
        {loading ? 'Extracting Text...' : '🔤 Extract Text from Image'}
      </button>

      {/* Result */}
      {result && (
        <div className="card p-5 space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-brand-400 font-medium text-sm">✅ Text Extracted</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                {result.split(/\s+/).filter(Boolean).length} words · {result.length} chars
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-secondary text-xs py-1.5 px-3">
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
              <button onClick={download} className="btn-secondary text-xs py-1.5 px-3">
                ⬇️ .txt
              </button>
            </div>
          </div>

          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={10}
            className="input resize-none font-mono text-sm leading-relaxed"
            placeholder="Extracted text will appear here..."
          />
          <p className="text-xs text-gray-600">You can edit the text above before copying</p>
        </div>
      )}

      {/* Reset */}
      {(file || result) && (
        <button onClick={reset} className="btn-secondary w-full text-sm">
          🔄 Start Over
        </button>
      )}

      {/* Tips */}
      <div className="card p-4">
        <p className="text-xs font-medium text-gray-400 mb-2">💡 Tips for best results</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Use high resolution images (300 DPI or higher)</li>
          <li>• Make sure text is clearly visible and not blurry</li>
          <li>• Good lighting and contrast helps accuracy</li>
          <li>• Select the correct language for better results</li>
          <li>• Works best with printed text (not handwriting)</li>
        </ul>
      </div>
    </ToolLayout>
  )
}