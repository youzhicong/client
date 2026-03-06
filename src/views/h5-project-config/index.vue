<template>
  <div class="h5-config-page">
    <header class="hero panel">
      <div class="hero-copy">
        <span class="hero-badge">H5 CMS</span>
        <h1>H5 项目后台数据配置</h1>
        <p>
          在这里统一维护 H5 页面基础信息、主题、导航、内容模块和发布参数。 后续
          H5 项目可以直接消费这份配置数据。
        </p>
      </div>

      <div class="hero-actions">
        <el-button @click="resetConfig">恢复默认</el-button>
        <el-button @click="copyConfig">复制 JSON</el-button>
        <el-button type="primary" @click="downloadConfig">导出配置</el-button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card panel">
        <span class="label">项目状态</span>
        <strong>{{ statusLabelMap[config.publish.status] }}</strong>
        <p>{{ config.project.name || '未命名项目' }}</p>
      </article>
      <article class="summary-card panel">
        <span class="label">导航数量</span>
        <strong>{{ config.navigation.length }}</strong>
        <p>首屏导航与锚点入口</p>
      </article>
      <article class="summary-card panel">
        <span class="label">模块数量</span>
        <strong>{{ config.modules.length }}</strong>
        <p>可用于 H5 页面内容编排</p>
      </article>
      <article class="summary-card panel">
        <span class="label">最近保存</span>
        <strong>{{ savedAtText }}</strong>
        <p>配置自动落到本地存储</p>
      </article>
    </section>

    <div class="workspace">
      <section class="editor">
        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>基础信息</span>
              <el-tag size="small" type="info">Project Meta</el-tag>
            </div>
          </template>

          <div class="form-grid cols-2">
            <el-form-item label="项目名称">
              <el-input
                v-model="config.project.name"
                placeholder="请输入项目名称"
              />
            </el-form-item>
            <el-form-item label="英文标识">
              <el-input
                v-model="config.project.slug"
                placeholder="例如: spring-campaign"
              />
            </el-form-item>
            <el-form-item label="页面标题">
              <el-input
                v-model="config.project.pageTitle"
                placeholder="H5 页面标题"
              />
            </el-form-item>
            <el-form-item label="页面描述">
              <el-input
                v-model="config.project.pageDesc"
                placeholder="用于分享和 SEO 的说明"
              />
            </el-form-item>
          </div>

          <div class="form-grid cols-2">
            <el-form-item label="主标题">
              <el-input v-model="config.hero.title" placeholder="主视觉标题" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input
                v-model="config.hero.subtitle"
                placeholder="主视觉副标题"
              />
            </el-form-item>
            <el-form-item label="主按钮文案">
              <el-input
                v-model="config.hero.ctaText"
                placeholder="例如：立即报名"
              />
            </el-form-item>
            <el-form-item label="主按钮跳转">
              <el-input
                v-model="config.hero.ctaLink"
                placeholder="/signup 或 https://..."
              />
            </el-form-item>
          </div>
        </el-card>

        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>主题与视觉</span>
              <el-tag size="small" type="success">Theme</el-tag>
            </div>
          </template>

          <div class="theme-grid">
            <el-form-item label="主色">
              <el-color-picker v-model="config.theme.primaryColor" show-alpha />
            </el-form-item>
            <el-form-item label="强调色">
              <el-color-picker v-model="config.theme.accentColor" show-alpha />
            </el-form-item>
            <el-form-item label="背景色">
              <el-color-picker
                v-model="config.theme.backgroundColor"
                show-alpha
              />
            </el-form-item>
            <el-form-item label="文本色">
              <el-color-picker v-model="config.theme.textColor" show-alpha />
            </el-form-item>
          </div>

          <el-form-item label="头图地址">
            <el-input
              v-model="config.hero.coverImage"
              placeholder="可填写 H5 头图 URL"
            />
          </el-form-item>
        </el-card>

        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>导航配置</span>
              <div class="head-actions">
                <el-button size="small" @click="addNavigation"
                  >新增导航</el-button
                >
              </div>
            </div>
          </template>

          <div class="list-grid">
            <div
              v-for="(item, index) in config.navigation"
              :key="item.id"
              class="list-item"
            >
              <div class="list-item-head">
                <strong>导航 {{ index + 1 }}</strong>
                <el-button
                  link
                  type="danger"
                  @click="removeNavigation(item.id)"
                >
                  删除
                </el-button>
              </div>
              <div class="form-grid cols-2 compact">
                <el-form-item label="名称">
                  <el-input v-model="item.label" placeholder="例如：活动介绍" />
                </el-form-item>
                <el-form-item label="锚点">
                  <el-input v-model="item.anchor" placeholder="#intro" />
                </el-form-item>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>内容模块</span>
              <div class="head-actions">
                <el-button size="small" @click="addModule">新增模块</el-button>
              </div>
            </div>
          </template>

          <div class="list-grid">
            <div
              v-for="(module, index) in config.modules"
              :key="module.id"
              class="list-item module-item"
            >
              <div class="list-item-head">
                <div>
                  <strong>模块 {{ index + 1 }}</strong>
                  <span class="module-type">{{ module.type }}</span>
                </div>
                <div class="module-actions">
                  <el-button
                    link
                    @click="moveModule(index, -1)"
                    :disabled="index === 0"
                  >
                    上移
                  </el-button>
                  <el-button
                    link
                    @click="moveModule(index, 1)"
                    :disabled="index === config.modules.length - 1"
                  >
                    下移
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="removeModule(module.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>

              <div class="form-grid cols-2 compact">
                <el-form-item label="模块名称">
                  <el-input v-model="module.title" placeholder="模块标题" />
                </el-form-item>
                <el-form-item label="模块类型">
                  <el-select v-model="module.type" style="width: 100%">
                    <el-option
                      v-for="type in moduleTypeOptions"
                      :key="type"
                      :label="type"
                      :value="type"
                    />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item label="说明文案">
                <el-input
                  v-model="module.description"
                  type="textarea"
                  :rows="3"
                  placeholder="模块介绍或说明"
                />
              </el-form-item>

              <div class="form-grid cols-3 compact">
                <el-form-item label="主指标">
                  <el-input
                    v-model="module.metric"
                    placeholder="例如：12,640"
                  />
                </el-form-item>
                <el-form-item label="按钮文案">
                  <el-input
                    v-model="module.buttonText"
                    placeholder="例如：查看详情"
                  />
                </el-form-item>
                <el-form-item label="按钮跳转">
                  <el-input v-model="module.buttonLink" placeholder="/detail" />
                </el-form-item>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="editor-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>发布配置</span>
              <el-tag size="small" :type="publishTagType">
                {{ statusLabelMap[config.publish.status] }}
              </el-tag>
            </div>
          </template>

          <div class="form-grid cols-2">
            <el-form-item label="发布状态">
              <el-select v-model="config.publish.status" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="测试中" value="testing" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>
            <el-form-item label="版本号">
              <el-input
                v-model="config.publish.version"
                placeholder="例如：1.0.0"
              />
            </el-form-item>
            <el-form-item label="H5 地址">
              <el-input
                v-model="config.publish.h5Url"
                placeholder="https://m.example.com/project"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="config.publish.remark"
                placeholder="补充发布说明"
              />
            </el-form-item>
          </div>
        </el-card>
      </section>

      <aside class="preview">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>手机预览</span>
              <el-tag size="small" type="warning">Live Preview</el-tag>
            </div>
          </template>

          <div class="phone-shell" :style="phoneStyle">
            <div class="phone-status">
              <span>9:41</span>
              <span>{{ config.project.name || 'H5 项目' }}</span>
            </div>

            <div class="phone-hero">
              <span class="hero-chip">{{
                config.project.slug || 'project-slug'
              }}</span>
              <h3>{{ config.hero.title || '请输入主标题' }}</h3>
              <p>
                {{ config.hero.subtitle || '请输入副标题，用于描述首屏信息。' }}
              </p>
              <button class="phone-cta">
                {{ config.hero.ctaText || '立即行动' }}
              </button>
            </div>

            <div class="phone-nav">
              <span v-for="item in config.navigation" :key="item.id">
                {{ item.label || '导航' }}
              </span>
            </div>

            <div class="phone-modules">
              <article
                v-for="module in config.modules"
                :key="module.id"
                class="phone-module"
              >
                <div class="module-head">
                  <strong>{{ module.title || '模块标题' }}</strong>
                  <span>{{ module.type }}</span>
                </div>
                <p>{{ module.description || '请输入模块描述' }}</p>
                <div class="module-foot">
                  <strong>{{ module.metric || '--' }}</strong>
                  <span>{{ module.buttonText || '查看详情' }}</span>
                </div>
              </article>
            </div>
          </div>
        </el-card>

        <el-card class="json-card" shadow="never">
          <template #header>
            <div class="card-head">
              <span>配置 JSON</span>
              <el-button link type="primary" @click="copyConfig"
                >复制</el-button
              >
            </div>
          </template>

          <pre class="json-output">{{ serializedConfig }}</pre>
        </el-card>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

type PublishStatus = 'draft' | 'testing' | 'published'
type ModuleType = 'banner' | 'feature' | 'timeline' | 'card-list' | 'cta'

type NavigationItem = {
  id: string
  label: string
  anchor: string
}

type ContentModule = {
  id: string
  type: ModuleType
  title: string
  description: string
  metric: string
  buttonText: string
  buttonLink: string
}

type H5ProjectConfig = {
  project: {
    name: string
    slug: string
    pageTitle: string
    pageDesc: string
  }
  hero: {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
    coverImage: string
  }
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  navigation: NavigationItem[]
  modules: ContentModule[]
  publish: {
    status: PublishStatus
    version: string
    h5Url: string
    remark: string
    updatedAt: string
  }
}

const STORAGE_KEY = 'pcdemo-h5-project-config'
const moduleTypeOptions: ModuleType[] = [
  'banner',
  'feature',
  'timeline',
  'card-list',
  'cta'
]

const statusLabelMap: Record<PublishStatus, string> = {
  draft: '草稿',
  testing: '测试中',
  published: '已发布'
}

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const createDefaultNavigation = (): NavigationItem[] => [
  { id: createId('nav'), label: '活动介绍', anchor: '#intro' },
  { id: createId('nav'), label: '亮点玩法', anchor: '#feature' },
  { id: createId('nav'), label: '立即参与', anchor: '#cta' }
]

const createDefaultModules = (): ContentModule[] => [
  {
    id: createId('module'),
    type: 'feature',
    title: '活动亮点',
    description: '支持通过后台快速配置 H5 头图、导航和模块内容。',
    metric: '3 大模块',
    buttonText: '查看亮点',
    buttonLink: '#feature'
  },
  {
    id: createId('module'),
    type: 'timeline',
    title: '活动节奏',
    description: '可配置活动预热、上线和复盘时间节点。',
    metric: '7 天周期',
    buttonText: '查看排期',
    buttonLink: '#timeline'
  },
  {
    id: createId('module'),
    type: 'cta',
    title: '立即参与',
    description: '底部按钮、外链和表单跳转都可以在这里统一维护。',
    metric: '转化入口',
    buttonText: '去报名',
    buttonLink: '/signup'
  }
]

const createDefaultConfig = (): H5ProjectConfig => ({
  project: {
    name: '春季活动 H5',
    slug: 'spring-campaign',
    pageTitle: '春季品牌活动',
    pageDesc: '用于移动端活动传播的 H5 页面配置'
  },
  hero: {
    title: '春季新品限时上新',
    subtitle: '用一套后台配置，快速生成适合活动投放和传播的 H5 页面。',
    ctaText: '立即查看',
    ctaLink: '/h5/spring-campaign',
    coverImage: ''
  },
  theme: {
    primaryColor: '#2f6bff',
    accentColor: '#ff7a45',
    backgroundColor: '#f4f7ff',
    textColor: '#132238'
  },
  navigation: createDefaultNavigation(),
  modules: createDefaultModules(),
  publish: {
    status: 'draft',
    version: '1.0.0',
    h5Url: 'https://m.example.com/spring-campaign',
    remark: '等待设计确认头图与分享图',
    updatedAt: new Date().toISOString()
  }
})

const loadStoredConfig = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createDefaultConfig()

  try {
    const parsed = JSON.parse(raw) as H5ProjectConfig
    return {
      ...createDefaultConfig(),
      ...parsed,
      project: { ...createDefaultConfig().project, ...parsed.project },
      hero: { ...createDefaultConfig().hero, ...parsed.hero },
      theme: { ...createDefaultConfig().theme, ...parsed.theme },
      publish: { ...createDefaultConfig().publish, ...parsed.publish },
      navigation:
        parsed.navigation?.length > 0
          ? parsed.navigation
          : createDefaultNavigation(),
      modules:
        parsed.modules?.length > 0 ? parsed.modules : createDefaultModules()
    }
  } catch {
    return createDefaultConfig()
  }
}

const config = reactive<H5ProjectConfig>(loadStoredConfig())

watch(
  config,
  (value) => {
    value.publish.updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true }
)

const savedAtText = computed(() => {
  const value = config.publish.updatedAt
  if (!value) return '未保存'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const publishTagType = computed(() => {
  switch (config.publish.status) {
    case 'published':
      return 'success'
    case 'testing':
      return 'warning'
    default:
      return 'info'
  }
})

const serializedConfig = computed(() => JSON.stringify(config, null, 2))

const phoneStyle = computed(() => ({
  '--phone-primary': config.theme.primaryColor,
  '--phone-accent': config.theme.accentColor,
  '--phone-bg': config.theme.backgroundColor,
  '--phone-text': config.theme.textColor
}))

const addNavigation = () => {
  config.navigation.push({
    id: createId('nav'),
    label: '',
    anchor: ''
  })
}

const removeNavigation = (id: string) => {
  if (config.navigation.length <= 1) {
    ElMessage.warning('导航至少保留一个')
    return
  }
  config.navigation = config.navigation.filter((item) => item.id !== id)
}

const addModule = () => {
  config.modules.push({
    id: createId('module'),
    type: 'feature',
    title: '',
    description: '',
    metric: '',
    buttonText: '',
    buttonLink: ''
  })
}

const removeModule = (id: string) => {
  if (config.modules.length <= 1) {
    ElMessage.warning('内容模块至少保留一个')
    return
  }
  config.modules = config.modules.filter((item) => item.id !== id)
}

const moveModule = (index: number, step: number) => {
  const target = index + step
  if (target < 0 || target >= config.modules.length) return
  const list = [...config.modules]
  ;[list[index], list[target]] = [list[target]!, list[index]!]
  config.modules = list
}

const copyConfig = async () => {
  await navigator.clipboard.writeText(serializedConfig.value)
  ElMessage.success('配置 JSON 已复制')
}

const downloadConfig = () => {
  const blob = new Blob([serializedConfig.value], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${config.project.slug || 'h5-project-config'}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('配置文件已导出')
}

const resetConfig = () => {
  const next = createDefaultConfig()
  config.project = next.project
  config.hero = next.hero
  config.theme = next.theme
  config.navigation = next.navigation
  config.modules = next.modules
  config.publish = next.publish
  ElMessage.success('已恢复默认配置')
}
</script>

<style lang="scss" scoped>
.h5-config-page {
  --page-bg: linear-gradient(180deg, #f6f8ff 0%, #edf3ff 100%);
  --panel-bg: rgba(255, 255, 255, 0.82);
  --line: #d9e4f5;
  --text-main: #17253a;
  --text-sub: #64748b;
  --brand: #316bff;
  --brand-soft: #f1f5ff;
  --brand-accent: #ff7a45;
  --shadow: 0 18px 40px rgba(28, 55, 112, 0.1);

  min-height: calc(100vh - 64px);
  padding: 22px;
  background: var(--page-bg);
  color: var(--text-main);
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel-bg);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}

.hero {
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #fff;
  background: linear-gradient(135deg, var(--brand) 0%, #6f54ff 100%);
}

.hero h1 {
  margin: 14px 0 10px;
  font-size: 34px;
  line-height: 1.05;
}

.hero p {
  max-width: 760px;
  margin: 0;
  color: var(--text-sub);
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 18px;
}

.summary-card .label {
  font-size: 12px;
  color: var(--text-sub);
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.summary-card p {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.workspace {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 380px;
  gap: 14px;
  align-items: start;
}

.editor {
  display: grid;
  gap: 14px;
}

.editor-card,
.preview-card,
.json-card {
  border-radius: 22px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.head-actions,
.module-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid.cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid.compact {
  gap: 10px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.list-grid {
  display: grid;
  gap: 12px;
}

.list-item {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
  background: #f8fbff;
}

.list-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.module-item {
  background: linear-gradient(
    180deg,
    rgba(49, 107, 255, 0.04),
    rgba(255, 255, 255, 0.88)
  );
}

.module-type {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-sub);
}

.preview {
  position: sticky;
  top: 84px;
  display: grid;
  gap: 14px;
}

.phone-shell {
  --phone-primary: #316bff;
  --phone-accent: #ff7a45;
  --phone-bg: #f4f7ff;
  --phone-text: #17253a;

  min-height: 680px;
  border-radius: 28px;
  padding: 18px;
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--phone-accent) 20%, white) 0%,
      transparent 32%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--phone-bg) 82%, white) 0%,
      var(--phone-bg) 100%
    );
  color: var(--phone-text);
  border: 1px solid rgba(49, 107, 255, 0.14);
}

.phone-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: color-mix(in srgb, var(--phone-text) 72%, white);
}

.phone-hero {
  margin-top: 18px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--phone-primary) 88%, white) 0%,
    color-mix(in srgb, var(--phone-accent) 78%, white) 100%
  );
  color: #fff;
}

.hero-chip {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.18);
}

.phone-hero h3 {
  margin: 14px 0 10px;
  font-size: 26px;
  line-height: 1.1;
}

.phone-hero p {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
}

.phone-cta {
  margin-top: 16px;
  min-width: 132px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand);
  font-weight: 700;
}

.phone-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.phone-nav span {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.74);
  color: color-mix(in srgb, var(--phone-text) 76%, white);
}

.phone-modules {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.phone-module {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(49, 107, 255, 0.1);
}

.module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-head strong {
  font-size: 15px;
}

.module-head span {
  font-size: 11px;
  color: var(--text-sub);
}

.phone-module p {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-sub);
}

.module-foot {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.module-foot strong {
  font-size: 18px;
  color: var(--brand);
}

.module-foot span {
  font-size: 12px;
  color: var(--brand-accent);
}

.json-output {
  margin: 0;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 18px;
  padding: 14px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .preview {
    position: static;
  }
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-grid.cols-2,
  .form-grid.cols-3,
  .theme-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .h5-config-page {
    padding: 14px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .phone-shell {
    min-height: auto;
  }
}
</style>
