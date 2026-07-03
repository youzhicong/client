import type { AgentToolDefinition } from './types'

export type CustomPluginKind = 'http' | 'mcp'

export type CustomHttpPlugin = {
  id: string
  name: string
  kind: CustomPluginKind
  url: string
  desc: string
  mcpServer?: string
}

const PLUGIN_KEY = 'flowagent-custom-plugins'

const sanitizeToolName = (name: string) =>
  'plugin_' +
  (name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'custom')

const normalizePlugin = (item: CustomHttpPlugin): CustomHttpPlugin => ({
  ...item,
  kind: item.kind || 'http'
})

export const getCustomHttpPlugins = (): CustomHttpPlugin[] => {
  if (typeof window === 'undefined') return []
  try {
    const items = JSON.parse(
      window.localStorage.getItem(PLUGIN_KEY) || '[]'
    ) as CustomHttpPlugin[]
    return items.map(normalizePlugin)
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
  kind?: CustomPluginKind
  url?: string
  mcpServer?: string
  desc?: string
}) => {
  const kind = payload.kind || 'http'
  const item: CustomHttpPlugin = {
    id: `plugin-${Date.now()}`,
    name: payload.name.trim(),
    kind,
    url: payload.url?.trim() || '',
    mcpServer: payload.mcpServer?.trim(),
    desc:
      payload.desc?.trim() ||
      (kind === 'mcp' ? 'MCP 工具插件（演示模拟）' : '自定义 HTTP 工具')
  }
  saveCustomHttpPlugins([item, ...getCustomHttpPlugins()])
  return item
}

export const removeCustomHttpPlugin = (id: string) => {
  saveCustomHttpPlugins(getCustomHttpPlugins().filter((item) => item.id !== id))
}

const executeMcpPlugin = async (plugin: CustomHttpPlugin, query: string) => {
  const server = plugin.mcpServer || plugin.name
  if (plugin.url) {
    try {
      const target = new URL(plugin.url)
      if (!target.searchParams.has('q')) target.searchParams.set('q', query)
      target.searchParams.set('mcp', server)
      const response = await fetch(target.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json, text/plain, */*' }
      })
      const text = await response.text()
      return text.slice(0, 4000)
    } catch (error) {
      return JSON.stringify({
        type: 'mcp_simulation',
        server,
        query,
        note: 'MCP 网关不可达，已返回本地模拟结果',
        result: `已通过 MCP「${server}」处理：${query}`,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
  return JSON.stringify({
    type: 'mcp_simulation',
    server,
    query,
    result: `MCP 插件「${plugin.name}」已模拟调用。生产环境需接入 MCP Client。`
  })
}

export const buildCustomPluginTools = (): AgentToolDefinition[] =>
  getCustomHttpPlugins().map((plugin) => ({
    name: sanitizeToolName(plugin.name),
    description:
      plugin.kind === 'mcp'
        ? plugin.desc || `MCP 插件：${plugin.name}`
        : plugin.desc || `HTTP 插件：${plugin.name}`,
    parameters: {
      query: {
        type: 'string',
        description: '请求参数或查询内容',
        required: true
      }
    },
    execute: async (args) => {
      const query = String(args.query || '').trim()
      if (!query) return JSON.stringify({ error: 'query 不能为空' })

      if (plugin.kind === 'mcp') {
        return executeMcpPlugin(plugin, query)
      }

      if (!plugin.url) {
        return JSON.stringify({ error: 'HTTP 插件未配置 URL' })
      }

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
