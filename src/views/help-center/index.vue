<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="HELP CENTER"
        title="帮助中心"
        description="集中查看常见问题、快捷入口和账号使用说明。"
      >
        <template #actions>
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索问题、功能、页面"
            :prefix-icon="Search"
            class="search-input"
          />
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid :columns="3">
        <PageStatCard label="快捷入口" :value="shortcuts.length" />
        <PageStatCard label="常见问题" :value="faqs.length" />
        <PageStatCard label="当前匹配" :value="filteredFaqs.length" />
      </PageStatGrid>
    </template>

    <section class="page-inline-section">
      <div class="page-inline-section__head">
        <h2>快捷入口</h2>
        <span>常用页面一键跳转</span>
      </div>

      <div class="shortcut-grid">
        <button
          v-for="item in shortcuts"
          :key="item.title"
          type="button"
          class="shortcut-card"
          @click="goShortcut(item.path)"
        >
          <div class="shortcut-icon">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </div>
          <div class="shortcut-copy">
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </div>
          <el-icon class="shortcut-arrow" :size="16"><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <div class="content-grid page-inline-section">
      <PagePanel>
        <div class="panel-head panel-head--section">
          <span>常见问题</span>
          <el-tag type="info">{{ filteredFaqs.length }} 条</el-tag>
        </div>

        <el-collapse v-if="filteredFaqs.length" accordion>
          <el-collapse-item
            v-for="item in filteredFaqs"
            :key="item.title"
            :title="item.title"
            :name="item.title"
          >
            <div class="faq-answer">{{ item.answer }}</div>
            <div class="faq-footer">
              <el-tag size="small">{{ item.category }}</el-tag>
              <el-button type="primary" link @click="goShortcut(item.path)">
                前往处理
              </el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-empty v-else description="没有匹配到相关问题" :image-size="72" />
      </PagePanel>

      <PagePanel>
        <div class="panel-head panel-head--section">
          <span>快速说明</span>
        </div>

        <div class="guide-list">
          <div class="guide-item">
            <strong>1. 登录与回跳</strong>
            <p>未登录访问内部页面时会自动跳转到登录页，登录后回到原页面。</p>
          </div>
          <div class="guide-item">
            <strong>2. 账号设置</strong>
            <p>可在“账号设置”中修改资料、通知偏好、安全选项和账单信息。</p>
          </div>
          <div class="guide-item">
            <strong>3. 个人中心</strong>
            <p>个人中心支持导出档案、编辑资料，并查看近期账号活动。</p>
          </div>
          <div class="guide-item">
            <strong>4. 帮助入口</strong>
            <p>顶部头像下拉中的“帮助中心”可直接进入本页。</p>
          </div>
        </div>

        <div class="contact-card">
          <strong>仍然需要帮助？</strong>
          <p>可联系平台管理员或先检查账号设置中的安全与通知配置。</p>
          <div class="contact-actions">
            <el-button type="primary" @click="goShortcut('/account-settings')">
              打开账号设置
            </el-button>
            <el-button @click="goShortcut('/profile')">打开个人中心</el-button>
          </div>
        </div>
      </PagePanel>
    </div>
  </PageShell>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import {
  ArrowRight,
  ChatDotRound,
  DataAnalysis,
  Grid,
  MagicStick,
  Notebook,
  Search,
  Setting,
  User
} from '@element-plus/icons-vue'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'

type ShortcutItem = {
  icon: Component
  title: string
  desc: string
  path: string
}

type FaqItem = {
  title: string
  answer: string
  category: string
  path: string
}

const router = useRouter()
const keyword = ref('')

const shortcuts: ShortcutItem[] = [
  {
    icon: Grid,
    title: '工作台概览',
    desc: '用量配额、能力成熟度、最近 Trace 与会话。',
    path: '/ai/dashboard'
  },
  {
    icon: MagicStick,
    title: '产品工作流',
    desc: 'Multi-Agent 研究、创意、评估与电子签章。',
    path: '/ai/workflow?q=咖啡&run=1'
  },
  {
    icon: ChatDotRound,
    title: 'Agent 聊天',
    desc: 'ReAct 工具调用、知识库检索与流式对话。',
    path: '/ai/chat'
  },
  {
    icon: Notebook,
    title: '知识库',
    desc: '上传文档，Agent 自动检索回答。',
    path: '/ai/knowledge'
  },
  {
    icon: DataAnalysis,
    title: '观测 Trace',
    desc: '查看工作流、聊天与自动化调用记录。',
    path: '/ai/observability'
  },
  {
    icon: Setting,
    title: '模型配置',
    desc: 'API Key 与 OpenAI 兼容接口。',
    path: '/ai/settings'
  },
  {
    icon: User,
    title: '个人中心',
    desc: '编辑资料、导出档案、查看动态。',
    path: '/profile'
  }
]

const faqs: FaqItem[] = [
  {
    title: '为什么访问页面会跳到登录页？',
    answer:
      '项目已启用基础登录守卫。未登录访问内部路由时，会自动跳转到登录页，登录成功后回到原页面。',
    category: '登录',
    path: '/login'
  },
  {
    title: '如何修改个人资料？',
    answer:
      '进入个人中心点击“编辑资料”，或前往账号设置的“基本资料”页进行修改。',
    category: '账号',
    path: '/account-settings?tab=profile'
  },
  {
    title: '如何验证邮箱和管理设备？',
    answer:
      '进入账号设置的“安全中心”，可验证邮箱、开启双重验证，并移除非当前设备。',
    category: '安全',
    path: '/account-settings?tab=security'
  },
  {
    title: '如何导出我的档案？',
    answer:
      '个人中心和账号设置都提供“导出档案”能力，会导出当前账号资料、偏好和近期活动。',
    category: '数据',
    path: '/profile'
  },
  {
    title: 'FlowAgent 包含哪些功能？',
    answer:
      '工作台含概览、应用广场、自动化；构建含 Multi-Agent 工作流、Agent 聊天、知识库、Prompt 工程、工具插件；运维含 Playground、观测 Trace、模型配置与 API 文档。',
    category: '导航',
    path: '/ai/dashboard'
  },
  {
    title: '知识库如何被 Agent 使用？',
    answer:
      '在知识库添加文档后，Agent 聊天与工作流可通过 search_knowledge_base 工具检索内容。可在聊天中提问「根据知识库回答…」验证效果。',
    category: 'AI',
    path: '/ai/knowledge'
  },
  {
    title: '如何查看调用记录？',
    answer:
      '概览页「最近 Trace」或运维模块「观测 Trace」可查看工作流、聊天、自动化等调用记录，并跳转回来源模块。',
    category: 'AI',
    path: '/ai/observability'
  },
  {
    title: '如何启动 Multi-Agent 工作流？',
    answer:
      '进入产品工作流页，输入关键词（如咖啡、宠物用品）后点击启动，系统将依次执行研究、创意、评估三阶段 Agent。',
    category: 'AI',
    path: '/ai/workflow'
  },
  {
    title: '如何修改 AI 接口配置？',
    answer:
      '进入模型配置页，填写 Base URL、API Key 和模型名称后保存，聊天与工作流将共用同一配置。',
    category: 'AI',
    path: '/ai/settings'
  },
  {
    title: '顶部通知中心如何工作？',
    answer:
      '工作流、聊天、自动化完成时会写入通知中心。点击铃铛可查看最近 8 条，支持全部已读、清空，并跳转回来源页面或观测 Trace。',
    category: '平台',
    path: '/ai/dashboard'
  },
  {
    title: '如何全局搜索内容？',
    answer:
      '顶部搜索框支持 Ctrl+K 聚焦，可检索菜单、知识库、Prompt、工作流历史、Trace 与聊天会话，点击结果直接跳转。',
    category: '平台',
    path: '/ai/dashboard'
  },
  {
    title: '用量与配额在哪里查看？',
    answer:
      '概览页「用量与配额」展示工作流运行、聊天轮次、本地存储与 Trace 的试用额度。接近上限时会高亮提醒，可前往账单页了解升级方案。',
    category: '平台',
    path: '/ai/dashboard'
  },
  {
    title: '如何备份工作区数据？',
    answer:
      '概览页点击「导出备份」，会下载 JSON 文件，包含知识库、Prompt、Trace、聊天会话与自动化配置等 localStorage 数据，便于迁移或归档。',
    category: '数据',
    path: '/ai/dashboard'
  },
  {
    title: 'Platform API 何时可用？',
    answer:
      'API 文档页已列出规划中的 REST 接口（会话、工作流、Trace、用量）。当前为前端演示版，正式接入需后端服务上线。',
    category: '平台',
    path: '/ai/api'
  }
]

const filteredFaqs = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return faqs
  return faqs.filter((item) =>
    [item.title, item.answer, item.category].some((field) =>
      field.toLowerCase().includes(text)
    )
  )
})

const goShortcut = (path: string) => {
  void router.push(path)
}
</script>

<style lang="scss" scoped>
@use '@/style/page-shell.scss';
@use '@/style/platform-page.scss';

.search-input {
  width: min(320px, 100%);
}

:deep(.page-hero) {
  border: 1px solid rgba(37, 99, 235, 0.12);
  background:
    radial-gradient(circle at 88% 12%, rgba(8, 145, 178, 0.1), transparent 42%),
    linear-gradient(135deg, #eff6ff 0%, var(--app-surface) 55%, #f5f3ff 100%);
  box-shadow: var(--app-shadow-sm);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.shortcut-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-muted);
  box-shadow: var(--app-shadow-sm);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.shortcut-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow);
  border-color: var(--app-accent-muted);
  background: var(--app-surface);
}

.shortcut-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: var(--app-radius-md);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.shortcut-copy {
  flex: 1;
  min-width: 0;
}

.shortcut-copy strong {
  display: block;
  margin-bottom: 6px;
  font-size: 15px;
  color: var(--app-text-main);
}

.shortcut-copy p,
.faq-answer,
.guide-item p,
.contact-card p {
  margin: 0;
  line-height: 1.7;
  color: var(--app-text-sub);
}

.shortcut-arrow {
  flex: 0 0 auto;
  margin-top: 4px;
  color: var(--app-text-faint);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.shortcut-card:hover .shortcut-arrow {
  transform: translateX(2px);
  color: var(--app-accent);
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-head--section {
  margin: -4px 0 12px;
  font-weight: 700;
  color: var(--app-text-main);
}

.faq-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.guide-list {
  display: grid;
  gap: 12px;
}

.guide-item {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  padding: 14px 16px;
  background: var(--app-surface-muted);
}

.guide-item strong {
  display: block;
  margin-bottom: 6px;
  color: var(--app-text-main);
}

.contact-card {
  margin-top: 16px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  padding: 16px;
  background: var(--app-accent-soft);
}

.contact-card strong {
  display: block;
  margin-bottom: 8px;
  color: var(--app-text-main);
}

.contact-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 1100px) {
  .shortcut-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .search-input,
  .shortcut-grid {
    width: 100%;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .contact-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
