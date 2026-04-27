import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 — Page Not Found · ToolHub</title></Helmet>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-7xl mb-6">🔧</div>
        <h1 className="font-display text-4xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          This page doesn't exist. But we have 13+ free tools waiting for you!
        </p>
        <Link to="/" className="btn-primary">← Back to All Tools</Link>
      </div>
    </>
  )
}