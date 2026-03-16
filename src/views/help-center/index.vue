<template>
  <div class="help-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div>
          <el-text class="hero-kicker">HELP CENTER</el-text>
          <h1>帮助中心</h1>
          <p>集中查看常见问题、快捷入口和账号使用说明。</p>
        </div>
        <el-input
          v-model="keyword"
          class="search-input"
          clearable
          placeholder="搜索问题、功能、页面"
        />
      </div>
    </el-card>

    <div class="shortcut-grid">
      <el-card
        v-for="item in shortcuts"
        :key="item.title"
        class="shortcut-card"
        shadow="never"
        @click="goShortcut(item.path)"
      >
        <div class="shortcut-icon">{{ item.icon }}</div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.desc }}</p>
      </el-card>
    </div>

    <div class="content-grid">
      <el-card shadow="never">
        <template #header>
          <div class="panel-head">
            <span>常见问题</span>
            <el-tag type="info">{{ filteredFaqs.length }} 条</el-tag>
          </div>
        </template>

        <el-collapse accordion>
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
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="panel-head">
            <span>快速说明</span>
          </div>
        </template>

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
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

type FaqItem = {
  title: string
  answer: string
  category: string
  path: string
}

const router = useRouter()
const keyword = ref('')

const shortcuts = [
  {
    icon: '👤',
    title: '个人中心',
    desc: '编辑资料、导出档案、查看动态。',
    path: '/profile'
  },
  {
    icon: '⚙️',
    title: '账号设置',
    desc: '通知偏好、安全设置、账单资产。',
    path: '/account-settings'
  },
  {
    icon: '🧑‍🤝‍🧑',
    title: '用户管理',
    desc: '查看成员、访问记录和当前访问 IP。',
    path: '/users'
  },
  {
    icon: '🤖',
    title: 'AI 设置',
    desc: '配置模型、API Key 和连接测试。',
    path: '/ai/settings'
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
    title: '如何修改 AI 接口配置？',
    answer:
      '进入 AI 工作流设置页，填写 Base URL、API Key 和模型信息后保存即可。',
    category: 'AI',
    path: '/ai/settings'
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
.help-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.hero-card,
.shortcut-card,
.content-grid :deep(.el-card) {
  border: 1px solid var(--app-border);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-kicker {
  letter-spacing: 0.12em;
}

.hero-content h1 {
  margin: 8px 0;
  font-size: 28px;
}

.hero-content p {
  margin: 0;
  color: var(--app-text-sub);
}

.search-input {
  width: 320px;
}

.shortcut-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.shortcut-card {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.shortcut-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--app-shadow);
}

.shortcut-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.shortcut-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.shortcut-card p,
.faq-answer,
.guide-item p,
.contact-card p {
  margin: 0;
  line-height: 1.7;
  color: var(--app-text-sub);
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  gap: 14px;
}

.guide-item {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 14px 16px;
}

.contact-card {
  margin-top: 18px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 16px;
}

.contact-card strong {
  display: block;
  margin-bottom: 8px;
}

.contact-actions {
  margin-top: 14px;
  display: flex;
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
  .help-page {
    padding: 16px;
  }

  .hero-content,
  .contact-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input,
  .shortcut-grid {
    width: 100%;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>
