const fs = require('fs')
const path = require('path')

const target = path.join(__dirname, '../src/style/platform-page.scss')
let content = fs.readFileSync(target, 'utf8')

if (content.includes('.platform-toolbar .btn-danger')) {
  console.log('already extended')
  process.exit(0)
}

const extra = `
  .platform-pill {
    &.success {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.28);
      color: #34d399;
    }

    &.error {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.28);
      color: #f87171;
    }

    &.running {
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.28);
      color: #60a5fa;
    }
  }

  .platform-toolbar .btn-danger {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;

    &:hover {
      background: rgba(239, 68, 68, 0.18);
      color: #fca5a5;
    }
  }

  .platform-list-item.error {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
  }

  .platform-empty {
    background: var(--app-surface-muted);
    border-color: var(--app-border-strong);
  }
`

content = content.replace(/\n}\s*$/, `${extra}\n}\n`)
fs.writeFileSync(target, content, 'utf8')
console.log('extended dark mode')
