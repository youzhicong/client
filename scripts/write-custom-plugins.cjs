const fs = require('fs')
const path = require('path')

const target = path.join(__dirname, '../src/services/ai-agent/custom-plugins.ts')

const content = `import type { AgentToolDefinition } from './types'

export type CustomHttpPlugin = {
  id: string
  name: string
  url: string
  desc: string
}

const PLUGIN_KEY = 'flowagent-custom-plugins'

const sanitizeToolName = (name: string) =>
  'plugin_' +
  (name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\\u4e00-\\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'custom')

export const getCustomHttpPlugins = (): CustomHttpPlugin[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(PLUGIN_KEY) || '[]')
  } catch {
    return []
  }
}

export const saveCustomHttpPlugins = (items: CustomHttpPlugin[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PLUGIN_KEY, JSON.stringify(items))
  }
}

export const addCustomHttpPlugin = (payload: {
  name: string
  url: string
  desc?: string
}) => {
  const item: CustomHttpPlugin = {
    id: \`plugin-\${Date.now()}\`,
    name: payload.name.trim(),
    url: payload.url.trim(),
    desc: payload.desc?.trim() || '自定义 HTTP 工具'
  }
  saveCustomHttpPlugins([item, ...getCustomHttpPlugins()])
  return item
}

export const removeCustomHttpPlugin = (id: string) => {
  saveCustomHttpPlugins(getCustomHttpPlugins().filter((item) => item.id !== id))
}

export const buildCustomPluginTools = (): AgentToolDefinition[] =>
  getCustomHttpPlugins().map((plugin) => ({
    name: sanitizeToolName(plugin.name),
    description: plugin.desc || \`HTTP 插件：\${plugin.name}\`,
    parameters: {
      query: { type: 'string', description: '请求参数或查询内容', required: true }
    },
    execute: async (args) => {
      const query = String(args.query || '').trim()
      if (!query) return JSON.stringify({ error: 'query 不能为空' })
      try {
        const target = new URL(plugin.url)
        if (!target.searchParams.has('q')) target.searchParams.set('q', query)
        const response = await fetch(target.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json, text/plain, */*' }
        })
        const text = await response.text()
        return text.slice(0, 4000)
      } catch (error) {
        return JSON.stringify({
          error: '插件调用失败',
          plugin: plugin.name,
          message: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }))
`

fs.writeFileSync(target, content, 'utf8')
console.log('Wrote', target)
