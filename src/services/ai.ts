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

/**
 * 获取 AI 设置
 */
export function getAISettings(): AISettings {
  const saved = localStorage.getItem('ai-settings')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // 解析失败使用默认值
    }
  }
  // 默认设置 - 优先使用 env 配置
  return {
    provider: 'deepseek',
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.deepseek.com',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'deepseek-chat'
  }
}

/**
 *  保存 AI 设置
 */
export function saveAISettings(settings: AISettings): void {
  localStorage.setItem('ai-settings', JSON.stringify(settings))
}

/**
 * 测试 AI 连接
 */
export async function testAIConnection(
  settings: AISettings
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return { success: true, message: 'API 连接成功！' }
    } else {
      await response.text()
      if (response.status === 401) {
        return { success: false, message: 'API Key 无效' }
      } else if (response.status === 402 || response.status === 429) {
        return { success: false, message: '余额不足或超出限制' }
      }
      return { success: false, message: `连接失败: ${response.status}` }
    }
  } catch {
    return { success: false, message: '网络错误，请检查 API 地址' }
  }
}

/**
 * 演示模式数据 - 当 API 不可用时使用
 */
function getDemoData(keyword: string): GenerationResult {
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

  // 如果有匹配的演示数据则返回，否则返回通用数据
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
export async function generateProductIdeas(
  keyword: string
): Promise<GenerationResult> {
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

  const settings = getAISettings()

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      console.warn('API 调用失败，使用演示数据')
      return getDemoData(keyword)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return getDemoData(keyword)
    }

    let parsed
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      return getDemoData(keyword)
    }

    return {
      keyword,
      categories: parsed.categories,
      timestamp: Date.now()
    }
  } catch {
    console.warn('网络错误，使用演示数据')
    return getDemoData(keyword)
  }
}

/**
 * 获取历史记录
 */
export function getHistory(): GenerationResult[] {
  const stored = localStorage.getItem('ai-workflow-history')
  return stored ? JSON.parse(stored) : []
}

/**
 * 保存到历史记录
 */
export function saveToHistory(result: GenerationResult): void {
  const history = getHistory()
  history.unshift(result)
  localStorage.setItem(
    'ai-workflow-history',
    JSON.stringify(history.slice(0, 10))
  )
}

/**
 * 清空历史记录
 */
export function clearHistory(): void {
  localStorage.removeItem('ai-workflow-history')
}

/**
 * 产品详情接口
 */
export interface ProductDetail {
  name: string
  description: string
  category: string
  marketPotential: string
  icon: string
  // 详细信息
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

/**
 * 生成产品详细信息（带缓存）
 */
export async function generateProductDetail(
  product: ProductIdea,
  keyword: string
): Promise<ProductDetail> {
  // 生成缓存 key
  const cacheKey = `product-detail-${keyword}-${product.name}`

  // 先检查缓存
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      // 缓存有效期 7 天
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('使用缓存的产品详情')
        return parsed.data
      }
    } catch {
      // 缓存解析失败，继续请求
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

  const settings = getAISettings()

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      console.warn('API 调用失败，使用演示数据')
      return getDemoProductDetail(product)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return getDemoProductDetail(product)
    }

    let parsed
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      return getDemoProductDetail(product)
    }

    const result = {
      ...product,
      ...parsed
    }

    // 保存到缓存
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: result, timestamp: Date.now() })
    )

    return result
  } catch {
    console.warn('网络错误，使用演示数据')
    return getDemoProductDetail(product)
  }
}

/**
 * 演示产品详情数据
 */
function getDemoProductDetail(product: ProductIdea): ProductDetail {
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
