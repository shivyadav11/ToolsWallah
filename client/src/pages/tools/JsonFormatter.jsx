import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import { formatJson } from '../../services/api'

export default function JsonFormatter() {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const [minify, setMinify] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!input.trim()) return toast.error('Enter JSON to format')
    setLoading(true)
    try {
      const res = await formatJson(input, minify)
      setResult(res.data.data)
    } finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(result?.result || '')
    toast.success('Copied!')
  }

  const clear = () => { setInput(''); setResult(null) }

  return (
    <ToolLayout title="JSON Formatter" description="Format, validate and minify JSON data instantly." icon="{ }">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-400 font-medium">Input JSON</label>
          <button onClick={clear} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
        </div>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setResult(null) }}
          placeholder={'{\n  "name": "ToolHub",\n  "version": "1.0.0"\n}'}
          rows={10}
          className="input resize-none font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={minify}
            onChange={(e) => setMinify(e.target.checked)}
            className="w-4 h-4 accent-brand-500 rounded"
          />
          <span className="text-sm text-gray-400">Minify JSON</span>
        </label>
      </div>

      <button onClick={handle} disabled={!input.trim() || loading} className="btn-primary w-full">
        {loading ? 'Formatting...' : '{ } Format JSON'}
      </button>

      {result && (
        <div className={`card p-5 animate-fade-up ${result.valid ? 'border-brand-600/30' : 'border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>{result.valid ? '✅' : '❌'}</span>
              <span className={`text-sm font-medium ${result.valid ? 'text-brand-400' : 'text-red-400'}`}>
                {result.valid ? 'Valid JSON' : 'Invalid JSON'}
              </span>
              {result.valid && result.length !== null && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {result.length} {result.type === 'object' ? 'keys' : 'items'}
                </span>
              )}
            </div>
            {result.valid && (
              <button onClick={copy} className="btn-secondary text-xs py-1.5 px-3">📋 Copy</button>
            )}
          </div>
          {result.valid ? (
            <pre className="text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-80 overflow-y-auto">
              {result.result}
            </pre>
          ) : (
            <p className="text-sm text-red-400 font-mono">{result.error}</p>
          )}
        </div>
      )}
    </ToolLayout>
  )
}