export default function ProgressBar({ progress, label = 'Processing...' }) {
  if (progress === null || progress === undefined) return null

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-sm text-brand-400 font-mono font-bold">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full
                     transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress < 100 && (
        <p className="text-xs text-gray-500 mt-2">Please wait, do not close this tab...</p>
      )}
    </div>
  )
}