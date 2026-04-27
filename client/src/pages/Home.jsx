


import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { TOOLS, CATEGORIES } from '../utils/toolsData'
import { useSearchParams } from 'react-router-dom'

export default function Home() {
const [searchParams] = useSearchParams()
const [activeCategory, setActiveCategory] = useState(
  searchParams.get('category') || 'all'
)

  searchParams.get('category') || 'all'

  const [search, setSearch] = useState('')

  const filtered = TOOLS.filter((t) => {
    const matchCat    = activeCategory === 'all' || t.category === activeCategory
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <Helmet>
        <title>ToolsWallah</title>
        <meta name="description" content="All-in-one free online tool platform. Compress images, merge PDFs, format JSON, generate passwords and more — no signup required." />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(37,163,110,0.1)',
            border: '1px solid rgba(37,163,110,0.3)',
            color: '#48be89', fontSize: '12px', fontWeight: '500',
            padding: '6px 16px', borderRadius: '9999px', marginBottom: '24px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#48be89', display: 'inline-block' }} />
            100% Free · No Signup Required · Files Auto-Deleted
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '800', color: 'white',
            lineHeight: '1.2', marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            All Tools You Need,{' '}
            <span style={{
              background: 'linear-gradient(to right, #48be89, #7dd8ad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              One Platform
            </span>
          </h1>

          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            PDF tools, image tools, developer utilities — everything free,
            fast and secure. No registration. No limits.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', marginBottom: '48px' }}>
            {[
              ['13+', 'Free Tools'],
              ['100%', 'Free Forever'],
              ['1 Hour', 'Auto File Delete'],
              ['0', 'Signup Required'],
            ].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#48be89' }}>{num}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* CTA Button */}

        </div>
      </section>

      {/* ── Tools Section ──────────────────────────────────── */}
      <section id="tools" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 80px' }}>

        {/* Section anchor IDs for navbar */}
        <div id="pdf-section"   style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
        <div id="image-section" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
        <div id="dev-section"   style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />

        {/* Search */}
        <div style={{ maxWidth: '480px', margin: '0 auto 32px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>🔍</span>
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: '44px' }}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '12px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer', border: '1px solid',
                transition: 'all 0.2s',
                backgroundColor: activeCategory === cat.id ? '#25a36e' : '#111827',
                borderColor:     activeCategory === cat.id ? '#25a36e' : '#1f2937',
                color:           activeCategory === cat.id ? 'white'   : '#9ca3af',
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tool grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</p>
            <p style={{ color: '#9ca3af' }}>No tools found for "{search}"</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {filtered.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{ padding: '20px', height: '100%', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(37,163,110,0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1f2937'}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(37,163,110,0.1)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px',
                    marginBottom: '12px'
                  }}>
                    {tool.icon}
                  </div>

                  {/* Name + Popular badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ color: 'white', fontWeight: '600', fontSize: '15px', margin: 0 }}>
                      {tool.name}
                    </h3>
                    {tool.popular && (
                      <span style={{
                        backgroundColor: 'rgba(37,163,110,0.2)', color: '#48be89',
                        fontSize: '10px', fontWeight: '600',
                        padding: '2px 8px', borderRadius: '9999px'
                      }}>
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                    {tool.description}
                  </p>

                  {/* Arrow */}
                  <p style={{ color: '#48be89', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>
                    Open tool →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Why ToolHub ────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1f2937', backgroundColor: 'rgba(17,24,39,0.3)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 1.5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '48px' }}>
            Why ToolHub?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {[
              { icon: '⚡', title: 'Lightning Fast',  desc: 'Tools run on our servers. Results in seconds.' },
              { icon: '🔒', title: '100% Private',    desc: 'Files deleted after 1 hour. We never store your data.' },
              { icon: '🆓', title: 'Always Free',     desc: 'Core tools are free forever. No credit card needed.' },
              { icon: '📱', title: 'Works Anywhere',  desc: 'Mobile-friendly. Works on any browser, any device.' },
            ].map((item) => (
              <div key={item.title} className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{item.icon}</div>
                <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}