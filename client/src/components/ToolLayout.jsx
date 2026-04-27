import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function ToolLayout({ title, description, icon, children }) {
  return (
    <>
      <Helmet>
        <title>{title} — ToolHub Free Online Tools</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-brand-400 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-gray-300">{title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="text-3xl">{icon}</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>

        {/* Tool content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-600 mt-10">
          🔒 Files are processed securely and auto-deleted after 1 hour
        </p>
      </div>
    </>
  )
}