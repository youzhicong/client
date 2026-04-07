<template>
  <div class="rich-text-page">
    <div class="bg-orb orb-a"></div>
    <div class="bg-orb orb-b"></div>

    <section class="hero panel">
      <div class="hero-copy">
        <span class="hero-badge">EDITOR LAB</span>
        <h1>富文本编辑器</h1>
        <p>
          支持标题、列表、引用、代码块、链接、图片和实时预览，页面内容会自动缓存在本地，方便你直接拿来写通知、活动稿和产品说明。
        </p>
      </div>

      <div class="hero-actions">
        <el-button plain @click="copyPlainText">复制纯文本</el-button>
        <el-button plain @click="copyHtml">复制 HTML</el-button>
        <el-button type="danger" plain @click="clearDraft">清空文稿</el-button>
      </div>
    </section>

    <div class="workspace">
      <section class="panel editor-panel">
        <div class="panel-head">
          <div>
            <h2>编辑区</h2>
            <p>左侧负责排版，右侧实时预览和导出源码。</p>
          </div>
          <span class="draft-tip">
            {{ saveStatusText }}
          </span>
        </div>

        <div class="meta-grid">
          <el-input
            v-model="draft.title"
            placeholder="请输入文稿标题"
            maxlength="50"
            show-word-limit
          />
          <el-input
            v-model="draft.summary"
            type="textarea"
            :rows="3"
            resize="none"
            placeholder="请输入摘要或导语"
            maxlength="140"
            show-word-limit
          />
        </div>

        <div class="toolbar-card">
          <div class="toolbar-row">
            <span class="toolbar-label">文本样式</span>
            <el-button-group>
              <el-button size="small" @mousedown.prevent="exec('bold')"
                >加粗</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('italic')"
                >斜体</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('underline')"
                >下划线</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('strikeThrough')"
                >删除线</el-button
              >
            </el-button-group>
          </div>

          <div class="toolbar-row">
            <span class="toolbar-label">结构排版</span>
            <el-button-group>
              <el-button size="small" @mousedown.prevent="formatBlock('p')"
                >正文</el-button
              >
              <el-button size="small" @mousedown.prevent="formatBlock('h2')"
                >H2</el-button
              >
              <el-button size="small" @mousedown.prevent="formatBlock('h3')"
                >H3</el-button
              >
              <el-button
                size="small"
                @mousedown.prevent="formatBlock('blockquote')"
                >引用</el-button
              >
              <el-button size="small" @mousedown.prevent="formatBlock('pre')"
                >代码块</el-button
              >
            </el-button-group>
          </div>

          <div class="toolbar-row">
            <span class="toolbar-label">列表与对齐</span>
            <el-button-group>
              <el-button
                size="small"
                @mousedown.prevent="exec('insertUnorderedList')"
                >无序列表</el-button
              >
              <el-button
                size="small"
                @mousedown.prevent="exec('insertOrderedList')"
                >有序列表</el-button
              >
            </el-button-group>
            <el-button-group>
              <el-button size="small" @mousedown.prevent="exec('justifyLeft')"
                >左对齐</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('justifyCenter')"
                >居中</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('justifyRight')"
                >右对齐</el-button
              >
            </el-button-group>
          </div>

          <div class="toolbar-row">
            <span class="toolbar-label">插入内容</span>
            <el-button-group>
              <el-button size="small" @mousedown.prevent="insertLink"
                >链接</el-button
              >
              <el-button size="small" @mousedown.prevent="insertImage"
                >图片</el-button
              >
              <el-button size="small" @mousedown.prevent="insertDivider"
                >分隔线</el-button
              >
            </el-button-group>
            <el-button-group>
              <el-button size="small" @mousedown.prevent="exec('undo')"
                >撤销</el-button
              >
              <el-button size="small" @mousedown.prevent="exec('redo')"
                >重做</el-button
              >
              <el-button size="small" @mousedown.prevent="clearSelectionFormat"
                >清除样式</el-button
              >
            </el-button-group>
          </div>
        </div>

        <div
          ref="editorRef"
          class="editor-canvas"
          contenteditable="true"
          data-placeholder="在这里输入正文内容，支持粘贴、排版和实时预览"
          @input="handleInput"
          @blur="saveSelection"
          @keyup="saveSelection"
          @mouseup="saveSelection"
        ></div>
      </section>

      <aside class="side-stack">
        <section class="panel stats-panel">
          <div class="panel-head compact">
            <div>
              <h2>内容概览</h2>
              <p>快速看当前稿件结构。</p>
            </div>
          </div>

          <div class="stats-grid">
            <article class="stat-card">
              <span>字数</span>
              <strong>{{ metrics.wordCount }}</strong>
            </article>
            <article class="stat-card">
              <span>段落</span>
              <strong>{{ metrics.paragraphCount }}</strong>
            </article>
            <article class="stat-card">
              <span>链接</span>
              <strong>{{ metrics.linkCount }}</strong>
            </article>
            <article class="stat-card">
              <span>图片</span>
              <strong>{{ metrics.imageCount }}</strong>
            </article>
          </div>
        </section>

        <section class="panel template-panel">
          <div class="panel-head compact">
            <div>
              <h2>快捷模板</h2>
              <p>一键载入常见文稿结构。</p>
            </div>
          </div>

          <div class="template-list">
            <button
              v-for="item in templates"
              :key="item.id"
              type="button"
              class="template-item"
              @click="applyTemplate(item)"
            >
              <strong>{{ item.name }}</strong>
              <span>{{ item.description }}</span>
            </button>
          </div>
        </section>

        <section class="panel output-panel">
          <div class="panel-head compact">
            <div>
              <h2>HTML 源码</h2>
              <p>可直接复制到接口或数据库。</p>
            </div>
            <el-button size="small" plain @click="copyHtml">复制</el-button>
          </div>

          <el-input
            :model-value="draft.content"
            type="textarea"
            :rows="12"
            resize="none"
            readonly
          />
        </section>

        <section class="panel preview-panel">
          <div class="panel-head compact">
            <div>
              <h2>实时预览</h2>
              <p>查看最终阅读效果。</p>
            </div>
          </div>

          <div class="preview-shell">
            <header class="preview-header">
              <span class="preview-label">PREVIEW</span>
              <h3>{{ draft.title || '未命名文稿' }}</h3>
              <p>
                {{
                  draft.summary || '在左侧输入标题和摘要后，这里会同步显示。'
                }}
              </p>
            </header>

            <div
              v-if="draft.content"
              class="preview-body"
              v-html="draft.content"
            ></div>
            <div v-else class="preview-empty">
              还没有正文内容，先在左侧输入一些文本试试。
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({
  name: 'RichTextEditorPage'
})

type DraftState = {
  title: string
  summary: string
  content: string
}

type EditorTemplate = {
  id: string
  name: string
  description: string
  title: string
  summary: string
  content: string
}

const STORAGE_KEY = 'rich-text-editor-page-draft'

const templates: EditorTemplate[] = [
  {
    id: 'notice',
    name: '活动通知',
    description: '适合校内通知、培训说明',
    title: '春季培训营开营通知',
    summary: '本周五晚正式开营，请相关同学提前完成签到和分组确认。',
    content: `<h2>活动安排</h2><p>春季培训营将于本周五 19:00 在报告厅开启，现场提供签到、资料领取和分组引导。</p><h3>参与须知</h3><ul><li>请提前 15 分钟到场签到</li><li>自带电脑与电源适配器</li><li>保持手机号畅通，便于通知变更</li></ul><blockquote>如因课程冲突无法参加，请在活动开始前联系班委报备。</blockquote>`
  },
  {
    id: 'release',
    name: '版本发布',
    description: '适合产品更新、版本说明',
    title: '4 月版本更新说明',
    summary: '本次版本重点优化内容编辑、审批链路和数据看板展示性能。',
    content: `<h2>重点更新</h2><ol><li><strong>新增：</strong>富文本编辑工作台，支持实时预览和 HTML 导出。</li><li><strong>优化：</strong>审批流列表筛选性能提升，首屏加载时间缩短约 28%。</li><li><strong>修复：</strong>移动端表单在窄屏下的布局错位问题。</li></ol><h3>影响范围</h3><p>本次升级不影响历史数据，可直接使用原有账号登录。</p><pre>build: 2026.04.03\nchannel: web</pre>`
  },
  {
    id: 'marketing',
    name: '活动预热',
    description: '适合宣传海报配文、推广稿',
    title: '周末市集抢先看',
    summary: '限定联名、互动打卡和夜场音乐表演会在周末集中上线，欢迎提前预约。',
    content: `<h2>亮点抢先看</h2><p>本周末市集将带来限定联名周边、夜场音乐演出和沉浸式互动装置。</p><p><img src="https://dummyimage.com/720x280/0f172a/ffffff&text=Weekend+Market" alt="周末市集海报"></p><h3>预约方式</h3><p>点击<a href="https://example.com" target="_blank" rel="noopener noreferrer">活动预约入口</a>，填写到场时间和人数即可锁定名额。</p><hr><p>现场将设置拍照点位和盖章地图，适合内容传播和社交分享。</p>`
  }
]

const draft = reactive<DraftState>({
  title: '',
  summary: '',
  content: ''
})

const editorRef = ref<HTMLDivElement | null>(null)
const cachedRange = ref<Range | null>(null)
const lastSavedAt = ref('')

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ')
const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()

const metrics = computed(() => {
  const plainText = normalizeText(stripHtml(draft.content))
  const paragraphMatches = draft.content.match(
    /<(p|h1|h2|h3|h4|h5|h6|li|blockquote|pre)\b/gi
  )

  return {
    wordCount: plainText.length,
    paragraphCount: paragraphMatches?.length ?? (plainText ? 1 : 0),
    linkCount: (draft.content.match(/<a\b/gi) || []).length,
    imageCount: (draft.content.match(/<img\b/gi) || []).length
  }
})

const saveStatusText = computed(() =>
  lastSavedAt.value
    ? `草稿已自动缓存于 ${lastSavedAt.value}`
    : '草稿会自动保存在本地'
)

const focusEditor = () => {
  editorRef.value?.focus()
}

const saveSelection = () => {
  const editor = editorRef.value
  const selection = window.getSelection()
  if (!editor || !selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  if (editor.contains(range.commonAncestorContainer)) {
    cachedRange.value = range.cloneRange()
  }
}

const restoreSelection = () => {
  const selection = window.getSelection()
  if (!selection || !cachedRange.value) return

  selection.removeAllRanges()
  selection.addRange(cachedRange.value)
}

const syncEditorHtml = async (html: string) => {
  await nextTick()
  if (!editorRef.value) return
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html
  }
}

const handleInput = () => {
  draft.content = editorRef.value?.innerHTML || ''
  saveSelection()
}

const exec = (command: string, value?: string) => {
  focusEditor()
  restoreSelection()
  document.execCommand(command, false, value)
  handleInput()
}

const formatBlock = (tagName: string) => {
  exec('formatBlock', `<${tagName}>`)
}

const sanitizeUrl = (url: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url.trim()
  return `https://${url.trim()}`
}

const insertLink = () => {
  const raw = window.prompt('请输入链接地址')
  if (!raw) return
  const url = sanitizeUrl(raw)
  if (!url) return
  exec('createLink', url)
}

const insertImage = () => {
  const raw = window.prompt('请输入图片地址')
  if (!raw) return
  const url = sanitizeUrl(raw)
  if (!url) return
  exec('insertImage', url)
}

const insertDivider = () => {
  exec('insertHorizontalRule')
}

const clearSelectionFormat = () => {
  exec('removeFormat')
  exec('unlink')
}

const writeClipboard = async (value: string) => {
  if (!value.trim()) {
    ElMessage.warning('当前没有可复制的内容')
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }
}

const copyHtml = async () => {
  const ok = await writeClipboard(draft.content)
  if (ok) {
    ElMessage.success('HTML 已复制')
  }
}

const copyPlainText = async () => {
  const ok = await writeClipboard(normalizeText(stripHtml(draft.content)))
  if (ok) {
    ElMessage.success('纯文本已复制')
  }
}

const touchLocalSaveTime = () => {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  lastSavedAt.value = formatter.format(new Date())
}

const persistDraft = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  touchLocalSaveTime()
}

const hasDraftContent = computed(
  () =>
    !!(
      draft.title.trim() ||
      draft.summary.trim() ||
      normalizeText(stripHtml(draft.content))
    )
)

const setDraft = async (payload: DraftState) => {
  draft.title = payload.title
  draft.summary = payload.summary
  draft.content = payload.content
  cachedRange.value = null
  await syncEditorHtml(payload.content)
}

const applyTemplate = async (template: EditorTemplate) => {
  const replace = async () => {
    await setDraft({
      title: template.title,
      summary: template.summary,
      content: template.content
    })
    persistDraft()
    ElMessage.success(`已载入模板：${template.name}`)
  }

  if (!hasDraftContent.value) {
    await replace()
    return
  }

  try {
    await ElMessageBox.confirm(
      '载入模板会覆盖当前文稿内容，是否继续？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '继续覆盖',
        cancelButtonText: '取消'
      }
    )
    await replace()
  } catch {
    // ignore cancel
  }
}

const clearDraft = async () => {
  if (!hasDraftContent.value) {
    await setDraft({ title: '', summary: '', content: '' })
    persistDraft()
    return
  }

  try {
    await ElMessageBox.confirm(
      '清空后当前文稿内容将被移除，是否继续？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确认清空',
        cancelButtonText: '取消'
      }
    )
    await setDraft({ title: '', summary: '', content: '' })
    persistDraft()
    ElMessage.success('文稿已清空')
  } catch {
    // ignore cancel
  }
}

watch(
  draft,
  () => {
    persistDraft()
  },
  { deep: true }
)

onMounted(async () => {
  const cached = localStorage.getItem(STORAGE_KEY)

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Partial<DraftState>
      await setDraft({
        title: parsed.title || '',
        summary: parsed.summary || '',
        content: parsed.content || ''
      })
      touchLocalSaveTime()
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  } else {
    await syncEditorHtml('')
  }
})
</script>

<style scoped lang="scss">
.rich-text-page {
  position: relative;
  min-height: calc(100vh - 64px);
  padding: 22px;
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      rgba(246, 251, 255, 0.96) 0%,
      rgba(237, 246, 251, 0.98) 100%
    ),
    linear-gradient(135deg, #f8fafc 0%, #edf5ff 100%);
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
  pointer-events: none;
}

.orb-a {
  top: 28px;
  right: 80px;
  width: 220px;
  height: 220px;
  background: radial-gradient(
    circle,
    rgba(37, 99, 235, 0.18) 0%,
    rgba(37, 99, 235, 0) 72%
  );
}

.orb-b {
  left: -20px;
  bottom: 30px;
  width: 260px;
  height: 260px;
  background: radial-gradient(
    circle,
    rgba(14, 165, 233, 0.16) 0%,
    rgba(14, 165, 233, 0) 70%
  );
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid rgba(214, 228, 238, 0.94);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px;
}

.hero-copy {
  max-width: 760px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f766e 0%, #2563eb 100%);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.1em;
}

.hero h1 {
  margin: 12px 0 10px;
  font-size: 34px;
  color: #0f172a;
}

.hero p {
  margin: 0;
  max-width: 720px;
  line-height: 1.8;
  color: #4b5563;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
}

.workspace {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.95fr);
  gap: 18px;
  margin-top: 18px;
}

.editor-panel,
.side-stack {
  min-height: 0;
}

.editor-panel {
  padding: 20px;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-head.compact {
  margin-bottom: 14px;
}

.panel-head h2 {
  margin: 0;
  font-size: 20px;
  color: #102a43;
}

.panel-head p {
  margin: 6px 0 0;
  color: #6b7b8b;
  line-height: 1.6;
}

.draft-tip {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef6ff;
  color: #2563eb;
  font-size: 12px;
  white-space: nowrap;
}

.meta-grid {
  display: grid;
  gap: 12px;
}

.toolbar-card {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #dbe8f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7fc 100%);
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.toolbar-row + .toolbar-row {
  margin-top: 10px;
}

.toolbar-label {
  min-width: 76px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.editor-canvas {
  min-height: 520px;
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid #d6e4ee;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(247, 251, 255, 0.98) 100%
  );
  color: #0f172a;
  font-size: 15px;
  line-height: 1.85;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

  &:empty::before {
    content: attr(data-placeholder);
    color: #94a3b8;
  }

  :deep(h2) {
    margin: 1.2em 0 0.6em;
    font-size: 28px;
    color: #0f172a;
  }

  :deep(h3) {
    margin: 1em 0 0.5em;
    font-size: 22px;
    color: #123b5d;
  }

  :deep(p) {
    margin: 0.75em 0;
  }

  :deep(blockquote) {
    margin: 1em 0;
    padding: 14px 16px;
    border-left: 4px solid #38bdf8;
    border-radius: 0 16px 16px 0;
    background: #eff8ff;
    color: #1e3a5f;
  }

  :deep(pre) {
    margin: 1em 0;
    padding: 16px;
    border-radius: 16px;
    background: #0f172a;
    color: #e2e8f0;
    overflow-x: auto;
    white-space: pre-wrap;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 16px;
  }

  :deep(hr) {
    margin: 20px 0;
    border: none;
    border-top: 1px solid #cbd5e1;
  }

  :deep(a) {
    color: #2563eb;
    text-decoration: underline;
  }
}

.stats-panel,
.template-panel,
.output-panel,
.preview-panel {
  padding: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  border: 1px solid #dbeafe;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
}

.template-list {
  display: grid;
  gap: 10px;
}

.template-item {
  width: 100%;
  border: 1px solid #d8e7f2;
  border-radius: 18px;
  padding: 14px 15px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-item:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.08);
}

.template-item strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
}

.template-item span {
  display: block;
  margin-top: 6px;
  color: #64748b;
  line-height: 1.5;
}

.preview-shell {
  border-radius: 20px;
  border: 1px solid #dde8f1;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.preview-header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid #e5edf5;
  background: linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%);
}

.preview-label {
  display: inline-flex;
  margin-bottom: 8px;
  color: #2563eb;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.preview-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.preview-header p {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.preview-body,
.preview-empty {
  padding: 18px;
}

.preview-empty {
  color: #94a3b8;
  line-height: 1.7;
}

.preview-body {
  color: #0f172a;
  line-height: 1.8;

  :deep(h2) {
    margin: 1.1em 0 0.65em;
    font-size: 26px;
  }

  :deep(h3) {
    margin: 1em 0 0.5em;
    font-size: 21px;
  }

  :deep(blockquote) {
    margin: 1em 0;
    padding: 14px 16px;
    border-left: 4px solid #38bdf8;
    border-radius: 0 16px 16px 0;
    background: #eff8ff;
  }

  :deep(pre) {
    padding: 16px;
    border-radius: 16px;
    background: #0f172a;
    color: #e2e8f0;
    overflow-x: auto;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 16px;
  }

  :deep(hr) {
    margin: 20px 0;
    border: none;
    border-top: 1px solid #cbd5e1;
  }

  :deep(a) {
    color: #2563eb;
  }
}

@media (max-width: 1200px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .editor-canvas {
    min-height: 440px;
  }
}

@media (max-width: 768px) {
  .rich-text-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .panel-head {
    flex-direction: column;
  }

  .draft-tip {
    white-space: normal;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-label {
    min-width: auto;
    width: 100%;
  }

  .editor-panel,
  .stats-panel,
  .template-panel,
  .output-panel,
  .preview-panel {
    padding: 16px;
  }
}
</style>
