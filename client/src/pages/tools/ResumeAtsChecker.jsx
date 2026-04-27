// =========================================================
//  pages/tools/ResumeAtsChecker.jsx
//  Upload PDF resume → get ATS score + detailed feedback
// =========================================================

import { useState } from 'react'
import toast from 'react-hot-toast'
import ToolLayout from '../../components/ToolLayout'
import FileDropzone from '../../components/FileDropzone'
import ProgressBar from '../../components/ProgressBar'
import api from '../../services/api'

const ScoreBar = ({ label, score, tip }) => {
  const color = score >= 75 ? '#25a36e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-sm font-bold font-mono" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-500">{tip}</p>
    </div>
  )
}

export default function ResumeAtsChecker() {
  const [file, setFile]   = useState(null)
  const [jd, setJd]       = useState('')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [showJd, setShowJd]     = useState(false)

  const onDrop = (f) => { setFile(f[0]); setResult(null) }

  const handle = async () => {
    if (!file) return toast.error('Upload your resume PDF first')
    setLoading(true); setProgress(0)
    try {
      const form = new FormData()
      form.append('file', file)
      if (jd.trim()) form.append('jobDescription', jd)

      const res = await api.post('/ats/check', form, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      })
      setResult(res.data.data)
      toast.success(`ATS Score: ${res.data.data.score}/100`)
    } catch {
      // error shown by interceptor
    } finally { setLoading(false); setProgress(null) }
  }

  const reset = () => { setFile(null); setResult(null); setJd('') }

  // Grade color
  const gradeColors = {
    green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400' },
  }

  return (
    <ToolLayout
      title="Resume ATS Checker"
      description="Check if your resume passes ATS filters. JobScan charges ₹1999/month — you get it FREE!"
      icon="📋"
    >
      {/* What is ATS */}
      <div className="card p-4 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-blue-400 mb-1">What is ATS?</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Applicant Tracking System — software companies use to filter resumes automatically.
              <strong className="text-white"> 75% of resumes are rejected by ATS</strong> before a human ever reads them.
              Our tool checks your resume against ATS criteria.
            </p>
          </div>
        </div>
      </div>

      {!result ? (
        <>
          <FileDropzone
            onDrop={onDrop}
            accept={{ 'application/pdf': ['.pdf'] }}
            label="Drop your Resume PDF here"
            hint="Text-based PDF only · Max 25MB · Scanned resumes won't work"
            files={file ? [file] : []}
          />

          {/* Optional JD */}
          <div className="card p-4">
            <button
              onClick={() => setShowJd(!showJd)}
              className="flex items-center justify-between w-full text-sm"
            >
              <span className="text-gray-300 font-medium">
                📋 Add Job Description <span className="text-gray-500">(optional — improves accuracy)</span>
              </span>
              <span className="text-gray-500">{showJd ? '▲' : '▼'}</span>
            </button>

            {showJd && (
              <div className="mt-3">
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here to get a match score..."
                  rows={5}
                  className="input resize-none text-sm mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Adding a JD shows how well your resume matches this specific job
                </p>
              </div>
            )}
          </div>

          <ProgressBar progress={progress} label="Analyzing your resume..." />

          <button
            onClick={handle}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? '🔍 Analyzing Resume...' : '📋 Check ATS Score'}
          </button>
        </>
      ) : (
        <div className="space-y-5 animate-fade-up">

          {/* Score card */}
          {(() => {
            const gc = gradeColors[result.gradeColor] || gradeColors.yellow
            return (
              <div className={`card p-6 ${gc.bg} ${gc.border} text-center`}>
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div>
                    <div className={`text-6xl font-display font-bold ${gc.text}`}>
                      {result.score}
                    </div>
                    <div className="text-gray-400 text-sm">out of 100</div>
                  </div>
                  <div>
                    <div className={`text-4xl font-display font-bold ${gc.text}`}>
                      {result.grade}
                    </div>
                    <div className="text-gray-400 text-sm">Grade</div>
                  </div>
                </div>
                <p className={`text-sm font-medium ${gc.text}`}>{result.gradeMessage}</p>
                <p className="text-xs text-gray-500 mt-1">{result.pages} page resume · {result.stats?.wordCount} words</p>
              </div>
            )
          })()}

          {/* JD Match */}
          {result.jdMatch && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">📎 Job Description Match</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-brand-400">{result.jdMatch.score}%</div>
                <div>
                  <p className="text-sm text-gray-300">Match Score</p>
                  <p className="text-xs text-gray-500">Keywords found in resume vs job description</p>
                </div>
              </div>
              {result.jdMatch.matchedKeywords?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-green-400 font-medium mb-2">✅ Matched keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.jdMatch.matchedKeywords.map((k) => (
                      <span key={k} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.jdMatch.missingKeywords?.length > 0 && (
                <div>
                  <p className="text-xs text-red-400 font-medium mb-2">❌ Missing keywords — add these!</p>
                  <div className="flex flex-wrap gap-2">
                    {result.jdMatch.missingKeywords.map((k) => (
                      <span key={k} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-5">📊 Score Breakdown</h3>
            {result.breakdown && Object.values(result.breakdown).map((item) => (
              <ScoreBar key={item.label} label={item.label} score={item.score} tip={item.tip} />
            ))}
          </div>

          {/* Issues & suggestions */}
          {result.issues?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">🔧 Issues & Suggestions</h3>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-400 bg-gray-800/40 rounded-xl px-4 py-3">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">📈 Resume Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Word Count',        value: result.stats?.wordCount },
                { label: 'Action Verbs',      value: result.stats?.actionVerbsUsed },
                { label: 'Metrics Found',     value: result.stats?.quantifiedPoints },
                { label: 'Skills Found',      value: result.stats?.skillsFound },
                { label: 'Has Email',         value: result.stats?.hasEmail   ? '✅ Yes' : '❌ No' },
                { label: 'Has LinkedIn',      value: result.stats?.hasLinkedIn ? '✅ Yes' : '❌ No' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-brand-400">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="btn-secondary w-full">
            🔄 Check Another Resume
          </button>
        </div>
      )}
    </ToolLayout>
  )
}