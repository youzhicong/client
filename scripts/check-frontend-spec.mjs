import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')
const semanticTagPattern =
  /<(section|article|header|footer|aside)\b|<\/(section|article|header|footer|aside)>/u

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath)
    }
  }

  return files
}

const toProjectPath = (filePath) => path.relative(rootDir, filePath).replace(/\\/gu, '/')

const vueFiles = walkFiles(srcDir)
const semanticViolations = []
const heavyEntries = []
const heavyComponents = []

for (const filePath of vueFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lineCount = content.split(/\r?\n/gu).length
  const projectPath = toProjectPath(filePath)

  if (semanticTagPattern.test(content)) {
    semanticViolations.push(projectPath)
  }

  const isViewEntry = /src\/views\/.+\/index\.vue$/u.test(projectPath)
  const isBusinessComponent =
    (/src\/views\/.+\.vue$/u.test(projectPath) && !isViewEntry) ||
    /src\/components\/.+\.vue$/u.test(projectPath)

  if (isViewEntry && lineCount > 80) {
    heavyEntries.push({ path: projectPath, lines: lineCount })
  }

  if (isBusinessComponent && lineCount > 300) {
    heavyComponents.push({ path: projectPath, lines: lineCount })
  }
}

let hasError = false

if (semanticViolations.length) {
  hasError = true
  console.error('Semantic layout tags found in Vue files:')
  for (const filePath of semanticViolations) {
    console.error(`- ${filePath}`)
  }
  console.error('')
}

if (heavyEntries.length) {
  hasError = true
  console.error('View entry files larger than 80 lines:')
  for (const item of heavyEntries.sort((a, b) => b.lines - a.lines)) {
    console.error(`- ${item.path} (${item.lines} lines)`)
  }
  console.error('')
}

if (heavyComponents.length) {
  hasError = true
  console.error('Business components larger than 300 lines:')
  for (const item of heavyComponents.sort((a, b) => b.lines - a.lines)) {
    console.error(`- ${item.path} (${item.lines} lines)`)
  }
  console.error('')
}

if (hasError) {
  process.exitCode = 1
} else {
  console.log('Frontend spec checks passed.')
}
