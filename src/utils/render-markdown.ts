const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const restoreCodeBlocks = (html: string, blocks: string[]) =>
  blocks.reduce(
    (result, block, index) =>
      result.replace('@@CODE_BLOCK_' + index + '@@', block),
    html
  )

export function renderMarkdown(source: string): string {
  if (!source.trim()) return ''

  const codeBlocks: string[] = []
  let text = source.replace(/\r\n/g, '\n')
  const fence = String.fromCharCode(96, 96, 96)

  if (text.includes(fence)) {
    const parts = text.split(fence)
    text = parts
      .map((part, index) => {
        if (index % 2 === 0) return part
        const blockIndex = codeBlocks.length
        codeBlocks.push(
          '<pre class="md-pre"><code>' +
            escapeHtml(part.replace(/^[^\n]*\n?/, '').trim()) +
            '</code></pre>'
        )
        return '@@CODE_BLOCK_' + blockIndex + '@@'
      })
      .join('')
  }

  const tick = String.fromCharCode(96)
  const inlineCode = new RegExp(tick + '([^' + tick + '\n]+)' + tick, 'g')
  text = text.replace(inlineCode, (_, code) => {
    return '<code class="md-code">' + escapeHtml(code) + '</code>'
  })

  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  text = text.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  text = text.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  text = text.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')

  const lines = text.split('\n')
  const chunks: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*] /.test(lines[index] ?? '')) {
        items.push(
          '<li>' + (lines[index] ?? '').replace(/^[-*] /, '') + '</li>'
        )
        index += 1
      }
      chunks.push('<ul class="md-ul">' + items.join('') + '</ul>')
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\. /.test(lines[index] ?? '')) {
        items.push(
          '<li>' + (lines[index] ?? '').replace(/^\d+\. /, '') + '</li>'
        )
        index += 1
      }
      chunks.push('<ol class="md-ol">' + items.join('') + '</ol>')
      continue
    }

    if (!line.trim()) {
      index += 1
      continue
    }

    if (
      line.startsWith('<h') ||
      line.startsWith('@@CODE_BLOCK_') ||
      line.startsWith('<pre')
    ) {
      chunks.push(line)
      index += 1
      continue
    }

    chunks.push('<p class="md-p">' + line + '</p>')
    index += 1
  }

  return restoreCodeBlocks(chunks.join(''), codeBlocks)
}
