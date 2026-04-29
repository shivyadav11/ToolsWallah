import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="font-display font-bold text-lg text-white">
                Tools<span className="text-brand-400">Wallah</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Free online tools for students, developers and professionals.
            </p>
          </div>

          {/* PDF Tools */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">PDF Tools</h4>
            <ul className="space-y-2">
              {[
                ['Merge PDF',     '/tools/merge-pdf'],
                ['Split PDF',     '/tools/split-pdf'],
                ['Compress PDF',  '/tools/compress-pdf'],
                ['PDF to Word',   '/tools/pdf-to-word'],
                ['JPG to PDF',    '/tools/jpg-to-pdf'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Image Tools */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Image Tools</h4>
            <ul className="space-y-2">
              {[
                ['Compress Image', '/tools/compress-image'],
                ['Resize Image',   '/tools/resize-image'],
                ['Convert Image',  '/tools/convert-image'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <h4 className="text-sm font-semibold text-gray-300 mt-4 mb-3">Dev Tools</h4>
              {[
                ['JSON Formatter',     '/tools/json-formatter'],
                ['Password Generator', '/tools/password-generator'],
                ['UUID Generator',     '/tools/uuid-generator'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Text Tools */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Text Tools</h4>
            <ul className="space-y-2">
              {[
                ['Word Counter',   '/tools/word-counter'],
                ['Case Converter', '/tools/case-converter'],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © 2026 ToolHub Build By Shiv! A Free online tools — no registration required.
          </p>
          <p className="text-gray-600 text-xs">
            Files are auto-deleted after 1 hour 🔒
          </p>
        </div>
      </div>
    </footer>
  )
}
