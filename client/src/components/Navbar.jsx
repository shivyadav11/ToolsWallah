import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {

  const navigate = useNavigate()

  const goToCategory = (category) => {
    // Go to home with category param
    navigate(`/?category=${category}`)
    setTimeout(() => {
      const el = document.getElementById('tools')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const scrollToTools = () => {
    navigate('/')
    setTimeout(() => {
      const el = document.getElementById('tools')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid #1f2937',
      backgroundColor: 'rgba(3,7,18,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: '#25a36e', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: 'White', fontWeight: 'bold', fontSize: '14px' }}>T</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: 'white' }}>
              Tools<span style={{ color: '#48be89' }}>Wallah</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[
              // { label: '📄 PDF Tools',   cat: 'pdf'   },
              // { label: '🖼️ Image Tools', cat: 'image' },
              // { label: '💻 Dev Tools',   cat: 'dev'   },
            ].map((item) => (
              <button
                key={item.cat}
                onClick={() => goToCategory(item.cat)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.target.style.color = 'white'; e.target.style.backgroundColor = '#1f2937' }}
                onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; e.target.style.backgroundColor = 'transparent' }}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={scrollToTools}
              style={{
                backgroundColor: '#25a36e', color: 'white',
                border: 'none', cursor: 'pointer',
                padding: '8px 20px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', marginLeft: '8px',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#48be89'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#25a36e'}
            >
              All Tools →
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}