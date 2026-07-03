import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'release',
  'coverage',
  'public/course-demo',
  '.temp-oligosaccharide'
])
const EXT_RE = /\.(ts|tsx|js|mjs|cjs|vue|scss|css|json)$/

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const rel = relative(ROOT, fullPath).replaceAll('\\\\', '/')
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(entry.name)) continue
      await walk(fullPath, files)
      continue
    }
    if (EXT_RE.test(entry.name)) files.push(fullPath)
  }
  return files
}

const files = await walk(ROOT)
const utf16Files = []
const corruptFiles = []

for (const file of files) {
  const rel = relative(ROOT, file).replaceAll('\\\\', '/')
  const bytes = await readFile(file)
  if (bytes.length >= 2 && bytes[1] === 0) {
    utf16Files.push(rel)
    continue
  }
  if (bytes.includes(0)) {
    corruptFiles.push(rel + ' (null bytes in UTF-8 file)')
    continue
  }
  if (rel.startsWith('src/')) {
    const text = bytes.toString('utf8')
    if (text.split('\n').some((line) => line.length > 80 && /\\n(import|export|const)\b/.test(line))) {
      corruptFiles.push(rel + ' (literal \\n escape instead of newline)')
    }
  }
}

if (utf16Files.length) {
  console.error('Found UTF-16 source files (convert to UTF-8 before commit):')
  for (const file of utf16Files) console.error('  - ' + file)
  process.exit(1)
}

if (corruptFiles.length) {
  console.error('Found corrupted source files (regenerate with node scripts, not UTF-16 Write):')
  for (const file of corruptFiles) console.error('  - ' + file)
  process.exit(1)
}

console.log('Encoding check passed (' + files.length + ' files scanned).')
