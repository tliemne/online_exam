import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import translationService from '../services/translationService'

/**
 * Hook to automatically translate data from backend
 * @param {any} data - Data to translate (object, array, or string)
 * @param {string[]} fields - Fields to translate (for objects/arrays)
 * @returns {any} Translated data
 */
export function useAutoTranslate(data, fields = []) {
  const { i18n } = useTranslation()
  const [translated, setTranslated] = useState(data)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const targetLang = i18n.language
    
    // Skip if Vietnamese (original language)
    if (targetLang === 'vi' || !data) {
      setTranslated(data)
      return
    }

    setLoading(true)

    const translateData = async () => {
      try {
        let result

        if (typeof data === 'string') {
          result = await translationService.translate(data, targetLang)
        } else if (Array.isArray(data)) {
          result = await translationService.translateArray(data, targetLang, 'vi', fields)
        } else if (typeof data === 'object') {
          result = await translationService.translateObject(data, targetLang, 'vi', fields)
        } else {
          result = data
        }

        setTranslated(result)
      } catch (error) {
        console.error('Auto-translate error:', error)
        setTranslated(data) // Fallback to original data
      } finally {
        setLoading(false)
      }
    }

    translateData()
  }, [data, i18n.language, fields])

  return { data: translated, loading }
}

/**
 * Hook to translate a single text
 * @param {string} text - Text to translate
 * @returns {string} Translated text
 */
export function useTranslateText(text) {
  const { i18n } = useTranslation()
  const [translated, setTranslated] = useState(text)

  useEffect(() => {
    const targetLang = i18n.language
    
    if (targetLang === 'vi' || !text) {
      setTranslated(text)
      return
    }

    translationService.translate(text, targetLang).then(setTranslated)
  }, [text, i18n.language])

  return translated
}
