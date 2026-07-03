export type AppTemplate = {
  id: string
  name: string
  icon: string
  category: string
  badge: string
  desc: string
  prompt?: { name: string; content: string; tags: string[] }
  workflowKeyword?: string
  chatQuery?: string
  knowledge?: { kbName: string; docTitle: string; content: string }
}

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'coffee-workflow',
    name: '咖啡品类策划',
    icon: '☕',
    category: '消费零售',
    badge: '热门',
    desc: '一键跑通研究→创意→评估→电子合同，含 Prompt 与示例知识',
    workflowKeyword: '咖啡',
    prompt: {
      name: '咖啡品类评估 Prompt',
      content:
        '你是消费品策划专家。基于「咖啡」品类工作流结果，输出：目标人群、3 个 SKU 建议、定价带、渠道组合与 30 天 MVP 计划。',
      tags: ['咖啡', 'workflow', 'template']
    },
    knowledge: {
      kbName: '咖啡行业资料',
      docTitle: '2025 咖啡消费趋势摘要',
      content:
        '精品咖啡与即饮场景增长；礼盒与订阅复购率高；一线城市白领与家庭用户是核心人群；价格带 39-199 元竞争最激烈。'
    }
  },
  {
    id: 'pet-supplies',
    name: '宠物用品创新',
    icon: '🐾',
    category: '宠物经济',
    badge: '新品类',
    desc: '预置宠物赛道 Prompt，安装后直接运行工作流',
    workflowKeyword: '宠物用品',
    prompt: {
      name: '宠物用品 MVP Prompt',
      content:
        '请基于宠物用品工作流产出，给出差异化 SKU、供应链注意点与小红书/抖音内容策略。',
      tags: ['宠物', 'template']
    }
  },
  {
    id: 'saas-mvp',
    name: 'SaaS MVP 顾问',
    icon: '🚀',
    category: 'Agent 聊天',
    badge: 'ReAct',
    desc: '安装 Prompt 后打开 Agent 聊天，自动拆解 MVP',
    chatQuery:
      '我是 B 端 SaaS 创始人，请用 analyze_requirement 拆解 MVP：目标用户、核心功能、4 周排期与验证指标。'
  },
  {
    id: 'honey-export',
    name: '蜂蜜出口方案',
    icon: '🍯',
    category: '农产品',
    badge: '工作流',
    desc: '农产品出海场景模板，含评估 Prompt',
    workflowKeyword: '蜂蜜',
    prompt: {
      name: '蜂蜜出海评估',
      content: '基于蜂蜜品类创意，评估出口合规、包装设计与渠道伙伴选择。',
      tags: ['蜂蜜', 'export']
    }
  }
]
