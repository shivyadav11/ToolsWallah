export default function ResultCard({ result, onReset }) {
  if (!result) return null

  const downloadUrl = result.downloadUrl
    ? result.downloadUrl.startsWith('http')
      ? result.downloadUrl
      : `http://localhost:5000${result.downloadUrl}`
    : null

  return (
    <div className="card p-6 border-brand-600/50 bg-brand-500/5 animate-fade-up">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          ✅
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1">{result.message}</h3>
          {result.filename && (
            <p className="text-sm text-gray-400 truncate mb-1">{result.filename}</p>
          )}
          {result.stats && (
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(result.stats).map(([key, val]) => (
                <span key={key} className="text-xs bg-gray-800 px-2.5 py-1 rounded-full text-gray-300">
                  {key}: <span className="text-brand-400 font-medium">{val}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={result.filename}
            className="btn-primary flex-1 text-center text-sm"
          >
            ⬇️ Download File
          </a>
        )}
        <button onClick={onReset} className="btn-secondary text-sm">
          Process Another
        </button>
      </div>
    </div>
  )
}