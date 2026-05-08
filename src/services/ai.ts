/**
 * AI 服务层 - 封装 AI API 调用
 */

export interface ProductIdea {
  name: string
  description: string
  category: string
  marketPotential: string
  icon: string
}

export interface GenerationResult {
  keyword: string
  categories: {
    name: string
    icon: string
    products: ProductIdea[]
  }[]
  timestamp: number
}

/**
 * AI 设置接口
 */
export interface AISettings {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export interface AIModelOption {
  id: string
  name: string
}

export interface AIProviderOption {
  id: string
  name: string
  icon: string
  baseUrl: string
  models: AIModelOption[]
  free: boolean
  hint?: string
}

export type AIMessageRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  role: AIMessageRole
  content: string
}

export interface AIChatOptions {
  temperature?: number
  maxTokens?: number
}

export interface ProductDetail {
  name: string
  description: string
  category: string
  marketPotential: string
  icon: string
  overview: string
  targetAudience: string[]
  keyFeatures: string[]
  productionProcess: string
  estimatedCost: string
  pricingStrategy: string
  marketAnalysis: string
  competitiveAdvantage: string[]
  risks: string[]
  recommendations: string[]
}

type AICompletionPayload = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string
            type?: string
          }>
    }
  }>
}

type AIErrorPayload = {
  error?: {
    message?: string
  }
  message?: string
}

const AI_SETTINGS_STORAGE_KEY = 'ai-settings'
const AI_WORKFLOW_HISTORY_KEY = 'ai-workflow-history'

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'deepseek',
  baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.deepseek.com',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'deepseek-chat'
}

export const AI_PROVIDERS: AIProviderOption[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔵',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    free: true
  },
  {
    id: 'qwen',
    name: '通义千问',
    icon: '🟢',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-max', name: 'Qwen Max' }
    ],
    free: true
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    icon: '🟣',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash (免费)' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus' }
    ],
    free: true
  },
  {
    id: 'longcat',
    name: 'LongCat',
    icon: '🟠',
    baseUrl: 'https://api.longcat.chat/openai',
    models: [
      { id: 'LongCat-Flash-Chat', name: 'LongCat Flash Chat' },
      { id: 'LongCat-Flash-Thinking', name: 'LongCat Flash Thinking' },
      {
        id: 'LongCat-Flash-Thinking-2601',
        name: 'LongCat Flash Thinking 2601'
      },
      { id: 'LongCat-Flash-Lite', name: 'LongCat Flash Lite' },
      { id: 'LongCat-Flash-Omni-2603', name: 'LongCat Flash Omni 2603' }
    ],
    free: false,
    hint: 'LongCat 兼容 OpenAI，推荐地址 https://api.longcat.chat/openai'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '⚪',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' }
    ],
    free: false
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '🔧',
    baseUrl: '',
    models: [],
    free: false,
    hint: '支持填写 OpenAI 兼容接口地址和任意模型名'
  }
]

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, '')

const parseUrl = (value: string) => {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

const resolveBaseUrl = (baseUrl: string, provider = 'custom') => {
  if (!baseUrl.trim()) return ''

  const parsed = parseUrl(baseUrl)
  if (!parsed) {
    return trimTrailingSlash(baseUrl)
  }

  const hostname = parsed.hostname.toLowerCase()
  const pathname = trimTrailingSlash(parsed.pathname)

  if (/\/chat\/completions$/i.test(pathname)) {
    return trimTrailingSlash(
      `${parsed.origin}${pathname.replace(/\/chat\/completions$/i, '')}`
    )
  }

  if (hostname === 'longcat.chat' || hostname === 'www.longcat.chat') {
    return 'https://api.longcat.chat/openai'
  }

  if (hostname === 'api.longcat.chat' && (!pathname || pathname === '/')) {
    return 'https://api.longcat.chat/openai'
  }

  if (
    (provider === 'openai' || hostname === 'api.openai.com') &&
    (!pathname || pathname === '/')
  ) {
    return 'https://api.openai.com/v1'
  }

  return trimTrailingSlash(`${parsed.origin}${pathname}`)
}

export const normalizeAISettings = (settings: AISettings): AISettings => {
  return {
    provider: settings.provider || 'custom',
    baseUrl: resolveBaseUrl(settings.baseUrl, settings.provider),
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim()
  }
}

/**
 * 获取 AI 设置
 */
export const getAISettings = (): AISettings => {
  const saved = localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
  if (saved) {
    try {
      return normalizeAISettings(JSON.parse(saved))
    } catch {
      // 解析失败使用默认值
    }
  }

  return normalizeAISettings(DEFAULT_AI_SETTINGS)
}

/**
 * 保存 AI 设置
 */
export const saveAISettings = (settings: AISettings): void => {
  localStorage.setItem(
    AI_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeAISettings(settings))
  )
}

export const getAIProviderById = (providerId: string) => {
  return AI_PROVIDERS.find((item) => item.id === providerId)
}

export const getAIChatEndpoint = (
  settings: Pick<AISettings, 'baseUrl' | 'provider'>
) => {
  const baseUrl = resolveBaseUrl(settings.baseUrl, settings.provider)

  if (!baseUrl) return ''
  if (/\/chat\/completions$/i.test(baseUrl)) return baseUrl
  if (/\/openai\/v\d+$/i.test(baseUrl)) return `${baseUrl}/chat/completions`
  if (/\/openai$/i.test(baseUrl)) return `${baseUrl}/v1/chat/completions`
  if (/\/v\d+$/i.test(baseUrl)) return `${baseUrl}/chat/completions`

  return `${baseUrl}/chat/completions`
}

const getTextContent = (content: AICompletionPayload['choices']) => {
  const rawContent = content?.[0]?.message?.content

  if (typeof rawContent === 'string') {
    return rawContent.trim()
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item) => item.text?.trim() || '')
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  return ''
}

const readErrorMessage = async (response: Response) => {
  let detail = ''

  try {
    const data = (await response.json()) as AIErrorPayload
    detail = data.error?.message || data.message || ''
  } catch {
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }
  }

  detail = detail.trim()

  if (response.status === 401) {
    return detail || 'API Key 无效或已过期'
  }

  if (response.status === 402 || response.status === 429) {
    return detail || '余额不足、调用频率过高或超出限制'
  }

  if (response.status === 404) {
    return detail || '接口不存在，请检查 Base URL 是否填写为兼容接口地址'
  }

  if (detail) {
    return `连接失败: ${response.status} ${detail}`
  }

  return `连接失败: ${response.status}`
}

const requestAIChatCompletion = async (
  settings: AISettings,
  messages: AIMessage[],
  options: AIChatOptions = {}
) => {
  const normalizedSettings = normalizeAISettings(settings)

  if (!normalizedSettings.baseUrl) {
    throw new Error('请输入 API 地址')
  }

  if (!normalizedSettings.apiKey) {
    throw new Error('请先配置 API Key')
  }

  if (!normalizedSettings.model) {
    throw new Error('请输入模型名称')
  }

  const endpoint = getAIChatEndpoint(normalizedSettings)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalizedSettings.apiKey}`
    },
    body: JSON.stringify({
      model: normalizedSettings.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens
    })
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = (await response.json()) as AICompletionPayload
  const content = getTextContent(data.choices)

  if (!content) {
    throw new Error('模型返回内容为空，请检查模型名称或接口兼容性')
  }

  return content
}

/**
 * 测试 AI 连接
 */
export const testAIConnection = async (
  settings: AISettings
): Promise<{ success: boolean; message: string }> => {
  const normalizedSettings = normalizeAISettings(settings)

  try {
    await requestAIChatCompletion(
      normalizedSettings,
      [
        {
          role: 'user',
          content: '你好，请回复“连接成功”。'
        }
      ],
      {
        temperature: 0,
        maxTokens: 16
      }
    )

    return {
      success: true,
      message: `连接成功，当前接口：${getAIChatEndpoint(normalizedSettings)}`
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : '网络错误，请检查 API 地址'
    }
  }
}

export const chatWithAI = async (
  messages: AIMessage[],
  options: AIChatOptions = {}
) => {
  return requestAIChatCompletion(getAISettings(), messages, options)
}

/**
 * 演示模式数据 - 当 API 不可用时使用
 */
const getDemoData = (keyword: string): GenerationResult => {
  const demoCategories: Record<
    string,
    { name: string; icon: string; products: ProductIdea[] }[]
  > = {
    养鸡: [
      {
        name: '鸡肉产品',
        icon: '🍗',
        products: [
          {
            name: '土鸡礼盒',
            description: '精选散养土鸡，真空包装，送礼佳品',
            category: '鸡肉产品',
            marketPotential: '高',
            icon: '🎁'
          },
          {
            name: '鸡肉干零食',
            description: '低脂高蛋白，健身人群必备小食',
            category: '鸡肉产品',
            marketPotential: '高',
            icon: '🥓'
          },
          {
            name: '即食鸡胸肉',
            description: '开袋即食，方便快捷的蛋白质来源',
            category: '鸡肉产品',
            marketPotential: '高',
            icon: '🍖'
          }
        ]
      },
      {
        name: '鸡蛋产品',
        icon: '🥚',
        products: [
          {
            name: '有机土鸡蛋',
            description: '散养土鸡产蛋，营养丰富，口感醇香',
            category: '鸡蛋产品',
            marketPotential: '高',
            icon: '🥚'
          },
          {
            name: '溏心蛋即食装',
            description: '日式溏心蛋，即开即食，早餐搭配',
            category: '鸡蛋产品',
            marketPotential: '中',
            icon: '🍳'
          },
          {
            name: '蛋黄酥糕点',
            description: '传统糕点与现代工艺结合，送礼首选',
            category: '鸡蛋产品',
            marketPotential: '中',
            icon: '🥮'
          }
        ]
      },
      {
        name: '羽毛产品',
        icon: '🪶',
        products: [
          {
            name: '羽绒被芯',
            description: '轻盈保暖，优质鹅绒填充，四季可用',
            category: '羽毛产品',
            marketPotential: '高',
            icon: '🛏️'
          },
          {
            name: '羽毛球',
            description: '专业比赛用球，飞行稳定，耐打性强',
            category: '羽毛产品',
            marketPotential: '中',
            icon: '🏸'
          }
        ]
      },
      {
        name: '有机肥料',
        icon: '🌱',
        products: [
          {
            name: '发酵鸡粪肥',
            description: '天然有机肥料，改良土壤，促进作物生长',
            category: '有机肥料',
            marketPotential: '中',
            icon: '🌾'
          },
          {
            name: '家庭园艺肥',
            description: '小包装设计，适合家庭阳台种植使用',
            category: '有机肥料',
            marketPotential: '中',
            icon: '🪴'
          }
        ]
      }
    ]
  }

  const categories = demoCategories[keyword] || [
    {
      name: '主要产品',
      icon: '⭐',
      products: [
        {
          name: `${keyword}精品礼盒`,
          description: `精选优质${keyword}产品，高端包装，送礼佳品`,
          category: '主要产品',
          marketPotential: '高',
          icon: '🎁'
        },
        {
          name: `${keyword}加工品`,
          description: `深加工${keyword}产品，延长保质期，提升附加值`,
          category: '主要产品',
          marketPotential: '中',
          icon: '📦'
        }
      ]
    },
    {
      name: '衍生产品',
      icon: '🔄',
      products: [
        {
          name: `${keyword}文创周边`,
          description: `以${keyword}为主题的创意周边产品`,
          category: '衍生产品',
          marketPotential: '中',
          icon: '🎨'
        }
      ]
    }
  ]

  return {
    keyword,
    categories,
    timestamp: Date.now()
  }
}

/**
 * 根据关键词生成产品创意
 */
export const generateProductIdeas = async (
  keyword: string
): Promise<GenerationResult> => {
  const prompt = `你是一个产品创意专家。用户输入一个关键词，请根据这个关键词生成一系列相关的产品创意。

关键词: "${keyword}"

请按分类生成产品创意，每个分类包含3-5个产品。返回JSON格式如下：
{
  "categories": [
    {
      "name": "分类名称",
      "icon": "表情符号emoji",
      "products": [
        {
          "name": "产品名称",
          "description": "产品描述(50字以内)",
          "category": "分类名称",
          "marketPotential": "市场潜力(高/中/低)",
          "icon": "表情符号emoji"
        }
      ]
    }
  ]
}

示例：如果关键词是"养鸡"，分类可以包括：鸡肉产品、鸡蛋产品、羽毛产品、有机肥料、鸡内脏产品等。

请只返回JSON，不要有其他文字。`

  try {
    const content = await requestAIChatCompletion(
      getAISettings(),
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        temperature: 0.8,
        maxTokens: 2000
      }
    )

    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(jsonStr) as Pick<GenerationResult, 'categories'>

    return {
      keyword,
      categories: parsed.categories,
      timestamp: Date.now()
    }
  } catch {
    console.warn('AI 工作流调用失败，使用演示数据')
    return getDemoData(keyword)
  }
}

/**
 * 获取历史记录
 */
export const getHistory = (): GenerationResult[] => {
  const stored = localStorage.getItem(AI_WORKFLOW_HISTORY_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * 保存到历史记录
 */
export const saveToHistory = (result: GenerationResult): void => {
  const history = getHistory()
  history.unshift(result)
  localStorage.setItem(
    AI_WORKFLOW_HISTORY_KEY,
    JSON.stringify(history.slice(0, 10))
  )
}

/**
 * 清空历史记录
 */
export const clearHistory = (): void => {
  localStorage.removeItem(AI_WORKFLOW_HISTORY_KEY)
}

/**
 * 生成产品详细信息（带缓存）
 */
export const generateProductDetail = async (
  product: ProductIdea,
  keyword: string
): Promise<ProductDetail> => {
  const cacheKey = `product-detail-${keyword}-${product.name}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return parsed.data
      }
    } catch {
      // ignore cached parse error
    }
  }

  const prompt = `你是一个产品分析专家。请为以下产品生成详细的商业分析报告。

原始关键词: "${keyword}"
产品名称: "${product.name}"
产品描述: "${product.description}"
产品分类: "${product.category}"

请生成详细信息，返回JSON格式如下：
{
  "overview": "产品概述(100字左右)",
  "targetAudience": ["目标客户群体1", "目标客户群体2", "目标客户群体3"],
  "keyFeatures": ["核心卖点1", "核心卖点2", "核心卖点3"],
  "productionProcess": "生产/制作流程简述(80字左右)",
  "estimatedCost": "预估成本范围",
  "pricingStrategy": "定价策略建议",
  "marketAnalysis": "市场分析(100字左右)",
  "competitiveAdvantage": ["竞争优势1", "竞争优势2"],
  "risks": ["潜在风险1", "潜在风险2"],
  "recommendations": ["发展建议1", "发展建议2", "发展建议3"]
}

请只返回JSON，不要有其他文字。`

  try {
    const content = await requestAIChatCompletion(
      getAISettings(),
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        temperature: 0.7,
        maxTokens: 1500
      }
    )

    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(jsonStr) as Omit<ProductDetail, keyof ProductIdea>

    const result: ProductDetail = {
      ...product,
      ...parsed
    }

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: result, timestamp: Date.now() })
    )

    return result
  } catch {
    console.warn('AI 详情调用失败，使用演示数据')
    return getDemoProductDetail(product)
  }
}

/**
 * 演示产品详情数据
 */
const getDemoProductDetail = (product: ProductIdea): ProductDetail => {
  return {
    ...product,
    overview: `${product.name}是一款基于${product.category}的创新产品。${product.description}该产品定位于中高端市场，致力于为消费者提供优质的产品体验。`,
    targetAudience: ['品质生活追求者', '注重健康的家庭消费者', '年轻白领群体'],
    keyFeatures: ['品质保证', '绿色天然', '便捷包装', '口感独特'],
    productionProcess:
      '采用现代化生产工艺，从原料筛选、加工处理、质量检测到包装出厂，全程严格把控，确保产品品质。',
    estimatedCost: '单位成本约 15-30 元',
    pricingStrategy:
      '建议采用中高端定价策略，零售价格定位在成本的2-3倍，突出品质和品牌价值。',
    marketAnalysis: `${product.category}市场近年来持续增长，消费升级趋势明显。目标市场容量预计达数十亿元，且仍有较大增长空间。`,
    competitiveAdvantage: ['差异化产品定位', '优质原料供应链', '品牌故事营销'],
    risks: ['原料价格波动风险', '市场竞争加剧', '消费者偏好变化'],
    recommendations: [
      '建立稳定的原料供应渠道',
      '加强品牌建设和线上营销',
      '开发产品系列，丰富产品线'
    ]
  }
}
