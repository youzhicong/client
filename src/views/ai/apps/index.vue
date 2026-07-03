<template>
  <AgentPlatformPage title="" description="" active="apps">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">App Market</span>
          <h2>应用广场</h2>
          <p>精选 Multi-Agent 工作流、Agent 聊天模板与平台模块，一键安装即用</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ appTemplates.length }}</strong>
            <span>应用模板</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ installedIds.length }}</strong>
            <span>已安装</span>
          </div>
        </div>
      </div>
    </header>

    <section class="platform-section featured-section">
      <div class="platform-section-head">
        <div>
          <strong>推荐应用</strong>
          <span>新用户从这里开始</span>
        </div>
      </div>
      <div class="featured-grid">
        <router-link
          v-for="app in featuredApps"
          :key="app.path"
          :to="app.path"
          class="featured-card platform-card"
          :class="`tone-${app.tone}`"
        >
          <span class="card-badge">{{ app.badge }}</span>
          <div class="app-icon">{{ app.icon }}</div>
          <strong>{{ app.name }}</strong>
          <span class="type">{{ app.type }}</span>
          <p>{{ app.desc }}</p>
          <span class="cta">{{ app.cta }} →</span>
        </router-link>
      </div>
    </section>

    <section class="platform-section template-section">
      <div class="platform-section-head">
        <div>
          <strong>应用模板</strong>
          <span>安装 Prompt / 知识库，一键跳转工作流或 Agent</span>
        </div>
      </div>
      <div class="template-grid">
        <article
          v-for="template in appTemplates"
          :key="template.id"
          class="template-card platform-card"
          :class="{ installed: isInstalled(template.id) }"
        >
          <div class="template-head">
            <span class="card-badge subtle">{{ template.badge }}</span>
            <span v-if="isInstalled(template.id)" class="installed-badge"
              >已安装</span
            >
          </div>
          <div class="app-icon">{{ template.icon }}</div>
          <strong>{{ template.name }}</strong>
          <span class="type">{{ template.category }}</span>
          <p>{{ template.desc }}</p>
          <button
            type="button"
            class="install-btn"
            :disabled="installingId === template.id"
            @click="handleInstall(template.id)"
          >
            {{ isInstalled(template.id) ? '再次运行' : '安装模板' }}
          </button>
        </article>
      </div>
    </section>

    <section class="platform-section all-section">
      <div class="platform-section-head">
        <div>
          <strong>全部模块</strong>
          <span>{{ moduleApps.length }} 个平台入口</span>
        </div>
      </div>
      <div class="app-grid">
        <router-link
          v-for="app in moduleApps"
          :key="app.path"
          :to="app.path"
          class="app-card platform-card"
        >
          <div class="app-icon">{{ app.icon }}</div>
          <strong>{{ app.name }}</strong>
          <span class="type">{{ app.type }}</span>
          <p>{{ app.desc }}</p>
          <span class="module-arrow">进入 →</span>
        </router-link>
      </div>
    </section>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import { APP_TEMPLATES } from '@/config/app-templates'
import { aiPlatformModules } from '@/config/ai-platform'
import {
  getInstalledTemplateIds,
  installAppTemplate
} from '@/services/app-template-service'

const router = useRouter()
const appTemplates = APP_TEMPLATES
const installedIds = ref<string[]>([])
const installingId = ref('')

const featuredApps = [
  {
    name: '咖啡品类全自动',
    type: 'Multi-Agent Workflow',
    path: '/ai/workflow?q=咖啡&run=1',
    icon: '☕',
    badge: '一键体验',
    tone: 'amber',
    desc: '市场研究 → 创意矩阵 → 评估 TOP → 电子合同签章，约 2 分钟出报告',
    cta: '立即运行'
  },
  {
    name: '产品策划 Agent',
    type: 'Agent Chat',
    path: '/ai/chat?send=1&q=帮我拆解一个 SaaS 产品的 MVP 路径',
    icon: '💬',
    badge: 'ReAct',
    tone: 'violet',
    desc: '工具调用 + 知识库检索 + 长期记忆，适合方案细化',
    cta: '开始对话'
  },
  {
    name: '工作流可视化报告',
    type: 'Report',
    path: '/ai/workflow',
    icon: '📊',
    badge: '产出物',
    tone: 'blue',
    desc: '运行工作流后自动生成可分享的产品矩阵报告页',
    cta: '先跑工作流'
  }
]

const moduleApps = aiPlatformModules.map((item) => ({
  name: item.label,
  type: item.key,
  path: item.path,
  icon:
    item.key === 'observability'
      ? '📈'
      : item.key === 'knowledge'
        ? '📚'
        : '📦',
  desc: item.desc
}))

const refreshInstalled = () => {
  installedIds.value = getInstalledTemplateIds()
}

const isInstalled = (id: string) => installedIds.value.includes(id)

const handleInstall = async (id: string) => {
  installingId.value = id
  try {
    const result = installAppTemplate(id)
    refreshInstalled()
    ElMessage.success(result.message)
    await router.push(
      result.nextQuery
        ? { path: result.nextPath, query: result.nextQuery }
        : result.nextPath
    )
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '安装失败')
  } finally {
    installingId.value = ''
  }
}

onMounted(refreshInstalled)
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.featured-grid,
.template-grid,
.app-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.featured-card,
.template-card,
.app-card {
  position: relative;
  text-decoration: none;
  display: block;
}

.featured-card {
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(37, 99, 235, 0.08),
      transparent 50%
    ),
    var(--app-surface);

  &.tone-amber .app-icon {
    background: #fffbeb;
  }
  &.tone-violet .app-icon {
    background: #f5f3ff;
  }
  &.tone-blue .app-icon {
    background: #eff6ff;
  }
}

.card-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--app-accent);
  color: #fff;

  &.subtle {
    position: static;
    display: inline-block;
    background: var(--app-surface-muted);
    color: var(--app-text-sub);
    border: 1px solid var(--app-border);
  }
}

.app-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 14px;
  font-size: 24px;
  background: var(--app-surface-muted);
}

strong {
  display: block;
  color: var(--app-text-main);
  margin-bottom: 6px;
  font-size: 15px;
}

.type {
  display: inline-block;
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  color: var(--app-text-faint);
  margin-bottom: 10px;
}

p {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--app-text-sub);
}

.cta,
.module-arrow {
  display: inline-block;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--app-accent);
}

.template-card {
  &.installed {
    border-color: #bbf7d0;
    background: linear-gradient(180deg, #f0fdf4 0%, var(--app-surface) 100%);
  }
}

.template-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-bottom: 8px;
}

.installed-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.install-btn {
  margin-top: 14px;
  width: 100%;
  padding: 9px 14px;
  border-radius: 10px;
  border: none;
  background: var(--app-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  &:hover:not(:disabled) {
    background: var(--app-accent-strong);
    transform: translateY(-1px);
  }
}

.template-card.installed .install-btn {
  background: var(--app-surface-muted);
  color: var(--app-accent);
  border: 1px solid var(--app-accent-muted);

  &:hover:not(:disabled) {
    background: var(--app-accent);
    color: #fff;
  }
}

@media (max-width: 960px) {
  .featured-grid,
  .template-grid,
  .app-grid {
    grid-template-columns: 1fr;
  }
}
</style>
