import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import { generatePassword } from '../../services/api'

export default function PasswordGenerator() {
  const [length, setLength]       = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers]     = useState(true)
  const [symbols, setSymbols]     = useState(false)
  const [count, setCount]         = useState(1)
  const [passwords, setPasswords] = useState([])
  const [strength, setStrength]   = useState('')
  const [loading, setLoading]     = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const res = await generatePassword({ length, uppercase, lowercase, numbers, symbols, count })
      setPasswords(res.data.data.passwords)
      setStrength(res.data.data.strength)
    } finally { setLoading(false) }
  }

  const copy = (pwd) => {
    navigator.clipboard.writeText(pwd)
    toast.success('Password copied!')
  }

  const strengthColor = {
    'very-strong': 'text-brand-400',
    'strong':      'text-green-400',
    'medium':      'text-yellow-400',
    'weak':        'text-red-400',
  }

  return (
    <ToolLayout title="Password Generator" description="Generate strong, secure, customizable passwords instantly." icon="🔐">
      <div className="card p-5 space-y-5">
        {/* Length */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Length: <span className="text-white font-bold">{length}</span>
          </label>
          <input type="range" min="4" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-brand-500" />
          <div className="flex justify-between text-xs text-gray-600 mt-1"><span>4</span><span>64</span></div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Uppercase (A-Z)',   val: uppercase, set: setUppercase },
            { label: 'Lowercase (a-z)',   val: lowercase, set: setLowercase },
            { label: 'Numbers (0-9)',      val: numbers,   set: setNumbers },
            { label: 'Symbols (!@#$)',    val: symbols,   set: setSymbols },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer bg-gray-800/50 rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors">
              <input type="checkbox" checked={opt.val} onChange={(e) => opt.set(e.target.checked)} className="w-4 h-4 accent-brand-500 rounded" />
              <span className="text-sm text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Count */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Number of passwords</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input">
            {[1, 3, 5, 10].map((n) => <option key={n} value={n}>{n} password{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handle} disabled={loading} className="btn-primary w-full">
        {loading ? 'Generating...' : '🔐 Generate Password'}
      </button>

      {passwords.length > 0 && (
        <div className="space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Generated passwords</span>
            {strength && (
              <span className={`text-xs font-semibold ${strengthColor[strength] || 'text-gray-400'}`}>
                Strength: {strength.replace('-', ' ')}
              </span>
            )}
          </div>
          {passwords.map((pwd, i) => (
            <div key={i} className="card p-4 flex items-center gap-3 group">
              <code className="flex-1 font-mono text-sm text-gray-100 break-all">{pwd}</code>
              <button onClick={() => copy(pwd)} className="btn-secondary text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                📋 Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}