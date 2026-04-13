// Translation Service using LibreTranslate API
const LIBRETRANSLATE_API = 'https://libretranslate.com/translate'
const CACHE_KEY_PREFIX = 'translation_cache_'

class TranslationService {
  constructor() {
    this.cache = this.loadCache()
  }

  // Load cache from localStorage
  loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + 'all')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  }

  // Save cache to localStorage
  saveCache() {
    try {
      localStorage.setItem(CACHE_KEY_PREFIX + 'all', JSON.stringify(this.cache))
    } catch (e) {
      console.warn('Failed to save translation cache:', e)
    }
  }

  // Generate cache key
  getCacheKey(text, targetLang) {
    return `${text}_${targetLang}`.toLowerCase()
  }

  // Translate single text
  async translate(text, targetLang = 'en', sourceLang = 'vi') {
    if (!text || typeof text !== 'string') return text
    if (targetLang === sourceLang) return text

    const cacheKey = this.getCacheKey(text, targetLang)
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey]
    }

    try {
      const response = await fetch(LIBRETRANSLATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      })

      if (!response.ok) throw new Error('Translation failed')

      const data = await response.json()
      const translated = data.translatedText

      // Save to cache
      this.cache[cacheKey] = translated
      this.saveCache()

      return translated
    } catch (error) {
      console.warn('Translation error:', error)
      return text // Return original text if translation fails
    }
  }

  // Translate multiple texts in batch
  async translateBatch(texts, targetLang = 'en', sourceLang = 'vi') {
    if (!Array.isArray(texts)) return texts
    if (targetLang === sourceLang) return texts

    const promises = texts.map(text => this.translate(text, targetLang, sourceLang))
    return Promise.all(promises)
  }

  // Translate object properties recursively
  async translateObject(obj, targetLang = 'en', sourceLang = 'vi', fieldsToTranslate = []) {
    if (!obj || typeof obj !== 'object') return obj
    if (targetLang === sourceLang) return obj

    const translated = { ...obj }

    for (const field of fieldsToTranslate) {
      if (translated[field] && typeof translated[field] === 'string') {
        translated[field] = await this.translate(translated[field], targetLang, sourceLang)
      }
    }

    return translated
  }

  // Translate array of objects
  async translateArray(array, targetLang = 'en', sourceLang = 'vi', fieldsToTranslate = []) {
    if (!Array.isArray(array)) return array
    if (targetLang === sourceLang) return array

    const promises = array.map(item => 
      this.translateObject(item, targetLang, sourceLang, fieldsToTranslate)
    )
    return Promise.all(promises)
  }

  // Clear cache
  clearCache() {
    this.cache = {}
    localStorage.removeItem(CACHE_KEY_PREFIX + 'all')
  }
}

export default new TranslationService()
