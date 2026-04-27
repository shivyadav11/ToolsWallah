import { Link } from 'react-router-dom'

export default function ToolCard({ tool, index = 0 }) {
  return (
    <Link
      to={tool.path}
      className={`card p-5 flex flex-col gap-3 group cursor-pointer
                  animate-fade-up opacity-0 ${tool.border}`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color}
                       flex items-center justify-center text-xl
                       group-hover:scale-110 transition-transform duration-300`}>
        <span className={typeof tool.icon === 'string' && tool.icon.length > 2
          ? `font-mono font-bold text-sm ${tool.accent}`
          : 'text-2xl'
        }>
          {tool.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
            {tool.name}
          </h3>
          {tool.popular && (
            <span className="badge bg-brand-500/20 text-brand-400 text-[10px]">
              Popular
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Arrow */}
      <div className={`flex items-center gap-1 text-xs font-medium ${tool.accent}
                       opacity-0 group-hover:opacity-100 transition-all duration-200
                       -translate-x-1 group-hover:translate-x-0`}>
        Open tool →
      </div>
    </Link>
  )
}