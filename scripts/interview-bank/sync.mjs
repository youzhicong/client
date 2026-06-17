import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import axios from 'axios'

const FRAMEWORK_KEYS = ['foundation', 'handwriting', 'vue', 'react']
const QUESTION_LEVELS = new Set(['初级', '中级', '高级'])
const DEFAULT_LEVEL = '中级'
const FRAMEWORK_LABELS = {
  foundation: '通用',
  handwriting: '手写题',
  vue: 'Vue',
  react: 'React'
}
const ROOT_DIR = process.cwd()
const DEFAULT_CONFIG_PATH = path.join(
  ROOT_DIR,
  'scripts',
  'interview-bank',
  'sources.json'
)
const DEFAULT_OUTPUT_PATH = path.join(
  ROOT_DIR,
  'src',
  'views',
  'frontend-interview',
  'generatedQuestionBank.ts'
)

const args = process.argv.slice(2)

const getArgValue = (flag) => {
  const index = args.indexOf(flag)
  if (index === -1) return ''
  return args[index + 1] ?? ''
}

const configPath = path.resolve(getArgValue('--config') || DEFAULT_CONFIG_PATH)
const explicitOutput = getArgValue('--output')

const decodeHtmlEntities = (value) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const stripTags = (value) =>
  decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|section|article|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

const escapeTemplate = (value) =>
  value.replace(/\\/g, '\\\\').replace(/`/g, '\\`')

const createSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

const normalizeTitle = (value) => value.trim().toLowerCase().replace(/\s+/g, '')

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

const getByPath = (input, keyPath) => {
  if (!keyPath) return input

  return keyPath.split('.').reduce((current, key) => {
    if (current == null) return undefined

    const arrayMatch = key.match(/^([^\[\]]+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, name, indexText] = arrayMatch
      const next = current[name]
      const index = Number(indexText)
      return Array.isArray(next) ? next[index] : undefined
    }

    return current[key]
  }, input)
}

const compileRegex = (pattern, flags = 'gis') => new RegExp(pattern, flags)

const extractNextDataContent = (html, contentPath) => {
  if (!contentPath) return html

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
  )

  if (!match?.[1]) {
    return html
  }

  try {
    const payload = JSON.parse(match[1])
    const content = getByPath(payload, contentPath)
    return typeof content === 'string' ? content : html
  } catch {
    return html
  }
}

const runFirstMatch = (input, patterns = []) => {
  for (const pattern of patterns) {
    const regex = compileRegex(pattern, 'is')
    const match = input.match(regex)
    if (match?.[1]) {
      return stripTags(match[1])
    }
  }

  return ''
}

const runGlobalMatches = (input, pattern, options = {}) => {
  if (!pattern) return []

  const regex = compileRegex(pattern)
  return Array.from(input.matchAll(regex))
    .map((match) =>
      options.raw ? String(match[1] ?? '').trim() : stripTags(match[1] ?? '')
    )
    .filter(Boolean)
}

const splitAnswerText = (value) =>
  value
    .split(/\n+|[;；]/)
    .map((line) => line.trim().replace(/^[\-*•\d.、)\s]+/, ''))
    .filter(Boolean)

const resolveTemplate = (template, input) =>
  String(template).replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, keyPath) => {
    const value = getByPath(input, String(keyPath).trim())
    return value == null ? '' : String(value)
  })

const fetchSourceBody = async (source) => {
  const method = String(source.method || 'GET').toUpperCase()

  if (source.filePath) {
    const filePath = path.resolve(ROOT_DIR, source.filePath)
    return fs.readFile(filePath, 'utf8')
  }

  if (!source.url) {
    throw new Error(`source ${source.id} 缺少 url 或 filePath`)
  }

  const response = await axios({
    url: source.url,
    method,
    timeout: source.timeoutMs ?? 15000,
    headers: source.headers ?? {},
    data: source.body ?? undefined
  })

  if (typeof response.data === 'string') {
    return response.data
  }

  return JSON.stringify(response.data)
}

const buildSourceUrl = (source, item) => {
  if (source.sourceUrlTemplate) {
    return resolveTemplate(source.sourceUrlTemplate, item)
  }

  if (source.sourceUrlPath) {
    const value = getByPath(item, source.sourceUrlPath)
    return value == null ? source.url || '' : String(value)
  }

  return source.url || ''
}

const extractFromJson = (payload, source) => {
  const items = getByPath(payload, source.itemPath)
  if (!Array.isArray(items)) {
    throw new Error(`source ${source.id} 的 itemPath 没有取到数组`)
  }

  return items.slice(0, source.maxItems ?? items.length).map((item, index) => {
    const title = String(getByPath(item, source.titlePath) ?? '').trim()
    const tagValues = source.tagsPath
      ? ensureArray(getByPath(item, source.tagsPath))
      : []
    const tags = tagValues
      .map((tag) => {
        if (source.tagsItemPath && tag && typeof tag === 'object') {
          return String(getByPath(tag, source.tagsItemPath) ?? '').trim()
        }

        return String(tag).trim()
      })
      .filter(Boolean)
    const answerValue = source.answerPath
      ? getByPath(item, source.answerPath)
      : undefined
    const answer = Array.isArray(answerValue)
      ? answerValue.map((line) => String(line).trim()).filter(Boolean)
      : splitAnswerText(String(answerValue ?? ''))
    const level = String(
      (source.levelPath ? getByPath(item, source.levelPath) : undefined) ??
        source.levelDefault ??
        DEFAULT_LEVEL
    )
    const titleFallback = title || `${source.name}-题目-${index + 1}`

    return {
      title: titleFallback,
      tags,
      answer,
      level,
      sourceUrl: buildSourceUrl(source, item)
    }
  })
}

const extractFromHtml = (html, source) => {
  const normalizedHtml = extractNextDataContent(html, source.contentPath)
  const blocks = runGlobalMatches(normalizedHtml, source.itemPattern, {
    raw: true
  })
  const items = (blocks.length ? blocks : [normalizedHtml]).slice(
    0,
    source.maxItems ?? (blocks.length || 1)
  )

  return items.map((item, index) => {
    const title = runFirstMatch(item, source.titlePatterns)
    const tags = source.tagPattern
      ? runGlobalMatches(item, source.tagPattern)
      : []
    const answerLines = source.answerItemPattern
      ? runGlobalMatches(item, source.answerItemPattern)
      : []
    const answerBlock = answerLines.length
      ? answerLines
      : splitAnswerText(runFirstMatch(item, source.answerBlockPatterns))
    const level = source.levelDefault ?? DEFAULT_LEVEL
    const titleFallback = title || `${source.name}-题目-${index + 1}`

    return {
      title: titleFallback,
      tags,
      answer: answerBlock,
      level,
      sourceUrl: source.url || ''
    }
  })
}

const resolveFramework = (source, question) => {
  const title = question.title || ''

  for (const rule of source.routeRules ?? []) {
    const regex = compileRegex(rule.pattern, 'i')
    if (regex.test(title)) {
      return rule.framework
    }
  }

  return source.framework
}

const normalizeQuestions = (source, questions, syncedAt) => {
  return questions
    .map((question, index) => {
      const title = question.title.trim()
      if (!title) return null

      const answer = question.answer.length
        ? question.answer
        : [`采集自 ${source.name}，当前只同步到题目，答案待补充。`]
      const normalizedLevel = QUESTION_LEVELS.has(question.level)
        ? question.level
        : source.levelDefault || DEFAULT_LEVEL
      const tags = Array.from(
        new Set(
          [...(source.tagsDefault ?? []), ...question.tags]
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      )

      return {
        id: `${source.id}-${String(index + 1).padStart(2, '0')}`,
        title,
        level: normalizedLevel,
        tags,
        answer,
        sourceName: source.name,
        sourceUrl: question.sourceUrl || source.url || '',
        syncedAt,
        framework: resolveFramework(source, question)
      }
    })
    .filter(Boolean)
}

const buildSection = (source, framework, questions) => ({
  key:
    framework === source.framework
      ? source.sectionKey || `${source.framework}-${createSlug(source.id)}`
      : `${source.sectionKey || `${source.framework}-${createSlug(source.id)}`}-${framework}`,
  title:
    framework === source.framework
      ? source.sectionTitle || source.name
      : `${source.sectionTitle || source.name} / ${FRAMEWORK_LABELS[framework]}`,
  desc:
    framework === source.framework
      ? source.sectionDesc || `${source.name} 自动采集题库`
      : `${source.sectionDesc || `${source.name} 自动采集题库`}（按标题关键词分流）`,
  questions
})

const toTsArray = (sections) => JSON.stringify(sections, null, 2)

const renderModule = ({
  buckets,
  generatedAt,
  sourceCount,
  questionCount
}) => `import type { InterviewSection } from './types'

export const generatedFoundationSections: InterviewSection[] = ${toTsArray(
  buckets.foundation
)}

export const generatedHandwritingSections: InterviewSection[] = ${toTsArray(
  buckets.handwriting
)}

export const generatedVueSections: InterviewSection[] = ${toTsArray(
  buckets.vue
)}

export const generatedReactSections: InterviewSection[] = ${toTsArray(
  buckets.react
)}

export const generatedQuestionBankMeta = {
  generatedAt: '${escapeTemplate(generatedAt)}',
  sourceCount: ${sourceCount},
  questionCount: ${questionCount}
}
`

const main = async () => {
  const rawConfig = await fs.readFile(configPath, 'utf8')
  const config = JSON.parse(rawConfig)
  const outputPath = path.resolve(
    explicitOutput || config.output || DEFAULT_OUTPUT_PATH
  )
  const sources = (config.sources ?? []).filter(
    (source) => source.enabled !== false
  )
  const generatedAt = new Date().toISOString()

  const buckets = {
    foundation: [],
    handwriting: [],
    vue: [],
    react: []
  }
  const globalTitleSet = new Set()

  let questionCount = 0

  for (const source of sources) {
    if (!FRAMEWORK_KEYS.includes(source.framework)) {
      throw new Error(
        `source ${source.id} 的 framework 不合法: ${source.framework}`
      )
    }

    const body = await fetchSourceBody(source)
    const rawQuestions =
      source.type === 'json'
        ? extractFromJson(JSON.parse(body), source)
        : extractFromHtml(body, source)
    const questions = normalizeQuestions(source, rawQuestions, generatedAt)

    if (!questions.length) {
      continue
    }

    const groupedQuestions = {
      foundation: [],
      handwriting: [],
      vue: [],
      react: []
    }

    for (const question of questions) {
      const dedupeKey = normalizeTitle(question.title)
      if (globalTitleSet.has(dedupeKey)) {
        continue
      }

      globalTitleSet.add(dedupeKey)
      groupedQuestions[question.framework].push({
        id: question.id,
        title: question.title,
        level: question.level,
        tags: question.tags,
        answer: question.answer,
        sourceName: question.sourceName,
        sourceUrl: question.sourceUrl,
        syncedAt: question.syncedAt
      })
      questionCount += 1
    }

    for (const framework of FRAMEWORK_KEYS) {
      if (!groupedQuestions[framework].length) {
        continue
      }

      buckets[framework].push(
        buildSection(source, framework, groupedQuestions[framework])
      )
    }
  }

  const content = renderModule({
    buckets,
    generatedAt,
    sourceCount: sources.length,
    questionCount
  })

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, content, 'utf8')

  console.log(
    `[interview-bank] generated ${questionCount} questions from ${sources.length} sources -> ${path.relative(
      ROOT_DIR,
      outputPath
    )}`
  )
}

main().catch((error) => {
  console.error('[interview-bank] sync failed')
  console.error(error)
  process.exitCode = 1
})
