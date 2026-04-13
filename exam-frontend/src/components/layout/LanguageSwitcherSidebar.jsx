import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcherSidebar({ collapsed }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ]

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  // Close khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Button */}
      <button
        onClick={() => setOpen(p => !p)}
        title={collapsed ? 'Ngôn ngữ' : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = ''
          e.currentTarget.style.color = 'var(--text-3)'
        }}>
        <span className="text-lg">{currentLang.flag}</span>
        {!collapsed && <span>{currentLang.name}</span>}
      </button>

      {/* Dropdown */}
      {open && !collapsed && (
        <div
          className="absolute bottom-full left-0 mb-2 w-full rounded-lg overflow-hidden z-50"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code)
                setOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
              style={{
                background: i18n.language === lang.code ? 'var(--accent-subtle)' : 'transparent',
                color: i18n.language === lang.code ? 'var(--accent)' : 'var(--text-2)',
                borderLeft: i18n.language === lang.code ? '3px solid var(--accent)' : '3px solid transparent',
              }}
              onMouseEnter={e => {
                if (i18n.language !== lang.code) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-1)'
                }
              }}
              onMouseLeave={e => {
                if (i18n.language !== lang.code) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-2)'
                }
              }}>
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {i18n.language === lang.code && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
