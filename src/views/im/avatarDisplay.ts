const IMAGE_SOURCE_RE = /^(https?:\/\/|data:image\/|blob:|\/)/i

export const canRenderAvatarImage = (value?: string | null) => {
  const source = value?.trim()
  if (!source) return false
  return IMAGE_SOURCE_RE.test(source)
}

export const getAvatarFallbackText = (value?: string | null) => {
  const normalized = value?.trim()
  if (!normalized) return '?'
  return normalized.charAt(0).toUpperCase()
}
