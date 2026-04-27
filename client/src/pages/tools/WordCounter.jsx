import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import { convertCase } from '../../services/api'

const TYPES = [
  { id: 'uppercase',    label: 'UPPER CASE' },
  { id: 'lowercase',    label: 'lower case' },
  { id: 'titlecase',    label: 'Title Case' },
  { id: 'sentencecase', label: 'Sentence case' },
  { id: 'camelcase',    label: 'camelCase' },
  { id: 'snakecase',    label: 'snake_case' },
  { id: 'kebabcase',    label: 'kebab-case' },
]

export default function CaseConverter() {
  const [text, setText]     = useState('')
  const [type, setType]     = useState('uppercase')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!text.trim()) return toast.error('Enter some text first')
    setLoading(true)
    try {
      const res = await convertCase(text, type)
      setResult(res.data.data.result)
    } finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    toast.success('Copied to clipboard!')
  }

  return (
    <ToolLayout title="Case Converter" description="Convert text between UPPERCASE, camelCase, snake_case and more." icon="Aa">
      <div className="card p-5">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult('') }}
          placeholder="Enter your text here..."
          rows={5}
          className="input resize-none text-sm"
        />
      </div>

      {/* Case type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-mono transition-all
              ${type === t.id
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button onClick={handle} disabled={!text.trim() || loading} className="btn-primary w-full">
        {loading ? 'Converting...' : 'Aa Convert Text'}
      </button>

      {result && (
        <div className="card p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Result</span>
            <button onClick={copy} className="btn-secondary text-xs py-1.5 px-3">📋 Copy</button>
          </div>
          <p className="text-gray-100 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
            {result}
          </p>
        </div>
      )}
    </ToolLayout>
  )
}