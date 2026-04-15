import { useMemo } from 'react'

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi

export function extractUrls(text) {
  if (!text) return []
  const matches = text.match(URL_REGEX)
  if (!matches) return []
  // Return unique URLs, max 3
  return [...new Set(matches)].slice(0, 3)
}

export function useUrlDetector(text) {
  return useMemo(() => extractUrls(text), [text])
}

// Render text with clickable links
export function renderTextWithLinks(text) {
  if (!text) return text
  const parts = text.split(URL_REGEX)
  // This is a simple approach - for React rendering use the component below
  return text
}
