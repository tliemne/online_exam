import { useState, useEffect } from 'react'

// Extract YouTube video ID from various URL formats
function getYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url)
}

// YouTube embed component
function YouTubeEmbed({ videoId, url }) {
  const [showEmbed, setShowEmbed] = useState(false)
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  if (showEmbed) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
      style={{ paddingBottom: '56.25%' }}
      onClick={() => setShowEmbed(true)}
    >
      <img
        src={thumbnailUrl}
        alt="YouTube thumbnail"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      {/* YouTube badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
        <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        YouTube
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        onClick={e => e.stopPropagation()}
        title="Mở trong tab mới"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    </div>
  )
}

// Generic link preview card using a CORS proxy to fetch OG tags
function GenericLinkPreview({ url }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchPreview = async () => {
      try {
        // Use allorigins.win as CORS proxy to fetch OG tags
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const html = data.contents

        // Parse OG tags from HTML
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        const getMeta = (property) => {
          const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
          return el?.getAttribute('content') || ''
        }

        const title = getMeta('og:title') || doc.title || ''
        const description = getMeta('og:description') || getMeta('description') || ''
        const image = getMeta('og:image') || ''
        const siteName = getMeta('og:site_name') || new URL(url).hostname

        if (!cancelled) {
          setPreview({ title, description, image, siteName })
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPreview()
    return () => { cancelled = true }
  }, [url])

  const hostname = (() => {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  })()

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)] animate-pulse">
        <div className="w-16 h-16 rounded-lg bg-[var(--bg-page)] shrink-0"/>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[var(--bg-page)] rounded w-3/4"/>
          <div className="h-3 bg-[var(--bg-page)] rounded w-1/2"/>
        </div>
      </div>
    )
  }

  if (error || !preview?.title) {
    // Fallback: simple link card
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-page)] transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-accent group-hover:underline truncate">{url}</p>
          <p className="text-xs text-[var(--text-3)]">{hostname}</p>
        </div>
        <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-page)] transition-colors overflow-hidden group"
    >
      {preview.image && (
        <div className="w-full h-40 overflow-hidden bg-[var(--bg-page)]">
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-[var(--text-3)] mb-1">{preview.siteName || hostname}</p>
        <p className="text-sm font-semibold text-[var(--text-1)] line-clamp-2 group-hover:text-accent transition-colors">
          {preview.title}
        </p>
        {preview.description && (
          <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </a>
  )
}

// Main LinkPreview component
export default function LinkPreview({ url }) {
  if (!url) return null

  const youtubeId = getYouTubeId(url)

  if (youtubeId) {
    return (
      <div className="mt-3 max-w-lg">
        <YouTubeEmbed videoId={youtubeId} url={url} />
      </div>
    )
  }

  return (
    <div className="mt-3 max-w-lg">
      <GenericLinkPreview url={url} />
    </div>
  )
}
