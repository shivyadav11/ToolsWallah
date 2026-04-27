import { useDropzone } from 'react-dropzone'

export default function FileDropzone({ onDrop, accept, multiple = false, label, hint, files = [] }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="text-4xl mb-4">
          {isDragActive ? '📂' : '⬆️'}
        </div>

        <p className="text-gray-300 font-medium text-base mb-1">
          {isDragActive ? 'Drop files here...' : label || 'Click or drag files here'}
        </p>

        <p className="text-gray-500 text-sm">{hint}</p>
      </div>

      {/* Show selected files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
              <span className="text-lg">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full">
                Ready
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}