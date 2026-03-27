type VideoProvider = 'youtube' | 'vimeo'

export type VideoEmbed = {
  provider: VideoProvider
  embedUrl: string
}

function parseYouTubeId(url: URL): string | undefined {
  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.replace(/^\/+/, '').split('/')[0]
    return id || undefined
  }

  if (url.hostname.includes('youtube.com')) {
    if (url.pathname.startsWith('/watch')) {
      return url.searchParams.get('v') ?? undefined
    }
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/').filter(Boolean)[1]
    }
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/').filter(Boolean)[1]
    }
  }

  return undefined
}

function parseVimeoId(url: URL): string | undefined {
  if (!url.hostname.includes('vimeo.com')) {
    return undefined
  }
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts.find((part) => /^\d+$/.test(part))
  return id || undefined
}

export function resolveVideoEmbed(input: string): VideoEmbed | undefined {
  const raw = input.trim()
  if (!raw) return undefined

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }

  const ytId = parseYouTubeId(url)
  if (ytId) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(ytId)}`,
    }
  }

  const vimeoId = parseVimeoId(url)
  if (vimeoId) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
    }
  }

  return undefined
}
