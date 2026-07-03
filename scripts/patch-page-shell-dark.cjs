const fs = require('fs')
const path = require('path')

const targets = [
  {
    file: '../src/style/page-shell.scss',
    marker: 'html.dark {',
    block: `

html.dark {
  .page-hero {
    border: 1px solid var(--app-border);
    background:
      radial-gradient(circle at 88% 12%, rgba(59, 130, 246, 0.1), transparent 42%),
      linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, var(--app-surface) 55%, rgba(109, 40, 217, 0.06) 100%);
  }

  .page-stat-card {
    background: var(--app-surface-muted);
  }
}
`
  }
]

for (const { file, marker, block } of targets) {
  const target = path.join(__dirname, file)
  let content = fs.readFileSync(target, 'utf8')
  if (content.includes(marker)) {
    console.log('skip', file)
    continue
  }
  fs.writeFileSync(target, content.trimEnd() + block, 'utf8')
  console.log('patched', file)
}
