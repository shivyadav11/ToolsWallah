import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import { generateUUID } from '../../services/api'

export default function UuidGenerator() {
  const [count, setCount]     = useState(5)
  const [uuids, setUuids]     = useState([])
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const res = await generateUUID(count)
      setUuids(res.data.data.uuids)
    } finally { setLoading(false) }
  }

  const copy = (uuid) => {
    navigator.clipboard.writeText(uuid)
    toast.success('UUID copied!')
  }

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'))
    toast.success(`${uuids.length} UUIDs copied!`)
  }

  return (
    <ToolLayout title="UUID Generator" description="Generate unique v4 UUIDs instantly for your projects." icon="🆔">
      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">How many UUIDs?</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input">
            {[1, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n} UUID{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handle} disabled={loading} className="btn-primary w-full">
        {loading ? 'Generating...' : `🆔 Generate ${count} UUID${count > 1 ? 's' : ''}`}
      </button>

      {uuids.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">{uuids.length} UUIDs generated</span>
            <button onClick={copyAll} className="btn-secondary text-xs py-1.5 px-3">📋 Copy All</button>
          </div>
          <div className="space-y-2">
            {uuids.map((uuid, i) => (
              <div key={i} className="card p-3 flex items-center gap-3 group cursor-pointer hover:border-brand-600/50" onClick={() => copy(uuid)}>
                <span className="text-gray-600 font-mono text-xs w-5">{i + 1}</span>
                <code className="flex-1 font-mono text-sm text-gray-200">{uuid}</code>
                <span className="text-xs text-gray-600 group-hover:text-brand-400 transition-colors">Copy</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}