import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    // { code: 'es', name: 'Español' },
    // { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' },
  ]

  return (
    <div className="flex items-center gap-2">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="px-3 py-2 rounded-lg border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-primary)',
          color: 'var(--text-1)',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
