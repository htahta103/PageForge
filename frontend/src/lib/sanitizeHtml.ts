const DISALLOWED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
])

export function sanitizeHtml(unsafeHtml: string): string {
  if (!unsafeHtml || typeof window === 'undefined') {
    return ''
  }

  const parser = new window.DOMParser()
  const doc = parser.parseFromString(unsafeHtml, 'text/html')

  const all = doc.body.querySelectorAll('*')
  for (const element of all) {
    const tag = element.tagName.toLowerCase()
    if (DISALLOWED_TAGS.has(tag)) {
      element.remove()
      continue
    }

    const attrs = [...element.attributes]
    for (const attr of attrs) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()

      if (name.startsWith('on')) {
        element.removeAttribute(attr.name)
        continue
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attr.name)
      }
    }
  }

  return doc.body.innerHTML
}
