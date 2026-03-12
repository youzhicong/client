<template>
  <div class="diary-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="hero panel">
      <div class="hero-left">
        <span class="hero-badge">YUANYUAN LOG</span>
        <h1>圆圆舔狗日记</h1>
        <p>
          记录每次互动、复盘表达方式，核心目标是更真诚、更尊重、更稳定地靠近喜欢的人。
        </p>
      </div>

      <div class="hero-right">
        <div class="stat-card">
          <span>总记录</span>
          <strong>{{ entries.length }}</strong>
        </div>
        <div class="stat-card">
          <span>本周新增</span>
          <strong>{{ weeklyCount }}</strong>
        </div>
        <div class="stat-card">
          <span>尊重分均值</span>
          <strong>{{ respectAverage }}</strong>
        </div>
      </div>
    </div>

    <div class="principles-grid">
      <div class="principle panel" v-for="item in principles" :key="item.title">
        <div class="title">{{ item.title }}</div>
        <p>{{ item.desc }}</p>
      </div>
    </div>

    <div class="main-grid">
      <div class="editor panel">
        <div class="block-head">
          <h3>新增日记</h3>
          <span>重点记录动作和复盘，不做空泛情绪输出</span>
        </div>

        <el-form :model="draft" label-position="top" class="entry-form">
          <el-form-item label="日期">
            <el-date-picker
              v-model="draft.date"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="今日主题">
            <el-input
              v-model="draft.title"
              placeholder="例如：第一次主动邀请她喝奶茶"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="今天做了什么">
            <el-input
              v-model="draft.action"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              placeholder="描述你的实际行为，而不是想象"
            />
          </el-form-item>

          <el-form-item label="对方反馈">
            <el-input
              v-model="draft.feedback"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="客观记录对方反应，不要脑补"
            />
          </el-form-item>

          <el-form-item label="下一步计划">
            <el-input
              v-model="draft.nextStep"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="给自己一个具体、可执行的小动作"
            />
          </el-form-item>

          <div class="form-inline">
            <el-form-item label="心情标签">
              <el-select v-model="draft.mood" style="width: 170px">
                <el-option label="🙂 稳定" value="稳定" />
                <el-option label="🔥 上头" value="上头" />
                <el-option label="😵 焦虑" value="焦虑" />
                <el-option label="💪 自信" value="自信" />
              </el-select>
            </el-form-item>

            <el-form-item label="尊重边界分（1-10）">
              <el-slider
                v-model="draft.respectScore"
                :min="1"
                :max="10"
                show-input
              />
            </el-form-item>
          </div>

          <div class="actions">
            <el-button type="primary" @click="addEntry">保存记录</el-button>
            <el-button @click="resetDraft">重置表单</el-button>
            <el-button @click="exportEntries" :disabled="!entries.length"
              >导出 JSON</el-button
            >
          </div>
        </el-form>
      </div>

      <main class="timeline panel">
        <div class="block-head">
          <h3>复盘时间线</h3>
          <div class="head-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索主题/动作"
              clearable
              class="keyword"
            />
            <el-button
              type="danger"
              plain
              @click="clearAll"
              :disabled="!entries.length"
              >清空</el-button
            >
          </div>
        </div>

        <div v-if="filteredEntries.length" class="entry-list">
          <div
            class="entry-card"
            v-for="item in filteredEntries"
            :key="item.id"
          >
            <div class="entry-head">
              <div>
                <h4>{{ item.title }}</h4>
                <span>{{ item.date }} · {{ item.mood }}</span>
              </div>
              <el-tag
                :type="
                  item.respectScore >= 8
                    ? 'success'
                    : item.respectScore >= 5
                      ? 'warning'
                      : 'danger'
                "
              >
                尊重分 {{ item.respectScore }}
              </el-tag>
            </div>

            <div class="entry-section">
              <label>今天做了什么</label>
              <p>{{ item.action }}</p>
            </div>

            <div class="entry-section">
              <label>对方反馈</label>
              <p>{{ item.feedback }}</p>
            </div>

            <div class="entry-section">
              <label>下一步计划</label>
              <p>{{ item.nextStep }}</p>
            </div>

            <div class="entry-foot">
              <span v-if="item.respectScore < 6" class="tip warning"
                >建议：降低频率，先关注对方舒适感。</span
              >
              <span v-else class="tip">继续保持真诚和边界感。</span>
              <el-button type="danger" text @click="removeEntry(item.id)"
                >删除</el-button
              >
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          暂无记录，先写下你今天的一次真实互动。
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

type DiaryEntry = {
  id: string
  date: string
  title: string
  action: string
  feedback: string
  nextStep: string
  mood: string
  respectScore: number
}

const STORAGE_KEY = 'yuanyuan-diary-entries'

const principles = [
  {
    title: '先尊重，再靠近',
    desc: '追求不是施压，任何互动都要以对方感受和边界为前提。'
  },
  {
    title: '先成长，再表达',
    desc: '把注意力放在自己的作息、沟通和稳定性上，吸引力来自长期价值。'
  },
  {
    title: '先行动，再复盘',
    desc: '每次互动都记录可改进点，避免情绪化决策和无意义内耗。'
  }
]

const entries = ref<DiaryEntry[]>([])
const keyword = ref('')
const todayString = () => new Date().toISOString().slice(0, 10)

const draft = ref<Omit<DiaryEntry, 'id'>>({
  date: todayString(),
  title: '',
  action: '',
  feedback: '',
  nextStep: '',
  mood: '稳定',
  respectScore: 8
})

const filteredEntries = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  const list = [...entries.value].sort((a, b) => (a.date < b.date ? 1 : -1))

  if (!key) return list
  return list.filter((item) => {
    return (
      item.title.toLowerCase().includes(key) ||
      item.action.toLowerCase().includes(key) ||
      item.feedback.toLowerCase().includes(key)
    )
  })
})

const weeklyCount = computed(() => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return entries.value.filter(
    (item) => new Date(item.date).getTime() >= oneWeekAgo.getTime()
  ).length
})

const respectAverage = computed(() => {
  if (!entries.value.length) return '0.0'
  const total = entries.value.reduce((sum, item) => sum + item.respectScore, 0)
  return (total / entries.value.length).toFixed(1)
})

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
}

const loadEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      entries.value = parsed
    }
  } catch {
    entries.value = []
  }
}

const resetDraft = () => {
  draft.value = {
    date: todayString(),
    title: '',
    action: '',
    feedback: '',
    nextStep: '',
    mood: '稳定',
    respectScore: 8
  }
}

const addEntry = () => {
  if (!draft.value.title.trim()) {
    ElMessage.warning('请填写今日主题')
    return
  }
  if (!draft.value.action.trim()) {
    ElMessage.warning('请填写今天做了什么')
    return
  }
  if (!draft.value.feedback.trim()) {
    ElMessage.warning('请填写对方反馈')
    return
  }

  const item: DiaryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...draft.value,
    title: draft.value.title.trim(),
    action: draft.value.action.trim(),
    feedback: draft.value.feedback.trim(),
    nextStep: draft.value.nextStep.trim() || '保持节奏，先做朋友式互动'
  }

  entries.value = [item, ...entries.value]
  persist()
  ElMessage.success('记录已保存')
  resetDraft()
}

const removeEntry = (id: string) => {
  entries.value = entries.value.filter((item) => item.id !== id)
  persist()
  ElMessage.success('已删除')
}

const clearAll = () => {
  ElMessageBox.confirm('确定清空全部日记记录吗？此操作不可恢复。', '清空确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      entries.value = []
      persist()
      ElMessage.success('已清空')
    })
    .catch(() => {})
}

const exportEntries = () => {
  const content = JSON.stringify(entries.value, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `yuanyuan-diary-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(() => {
  loadEntries()
})
</script>

<style lang="scss" scoped>
.diary-page {
  --bg-main: #f4f5f0;
  --panel-bg: rgba(255, 255, 255, 0.86);
  --line: #dfe1d5;
  --text-main: #2f3324;
  --text-sub: #7b8067;
  --brand: #7a8f2d;
  --shadow: 0 20px 42px rgba(50, 56, 35, 0.12);

  min-height: calc(100vh - 60px);
  position: relative;
  padding: 22px;
  overflow: hidden;
  color: var(--text-main);
  background:
    radial-gradient(circle at 8% 8%, #ebf3d0 0%, transparent 35%),
    radial-gradient(circle at 92% 8%, #ffe8ce 0%, transparent 32%),
    var(--bg-main);
  font-family: 'Fraunces', 'PingFang SC', 'Microsoft YaHei', serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(30px);
  opacity: 0.36;
  pointer-events: none;
}

.shape-a {
  width: 240px;
  height: 240px;
  right: -80px;
  top: 80px;
  background: #d9eeb9;
}

.shape-b {
  width: 220px;
  height: 220px;
  left: -80px;
  bottom: 100px;
  background: #f8d6b2;
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #7a8f2d 0%, #c47d2e 100%);
}

.hero-left h1 {
  margin: 12px 0 8px;
  font-size: 34px;
  line-height: 1.1;
}

.hero-left p {
  margin: 0;
  font-size: 14px;
  color: var(--text-sub);
}

.hero-right {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  border: 1px solid #d9ddc9;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(250, 251, 243, 0.72);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.stat-card span {
  color: var(--text-sub);
  font-size: 12px;
}

.stat-card strong {
  font-size: 26px;
  line-height: 1;
}

.principles-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.principle {
  padding: 14px;
}

.principle .title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}

.principle p {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.5;
}

.main-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  gap: 12px;
}

.editor,
.timeline {
  padding: 16px;
}

.block-head {
  margin-bottom: 12px;
}

.block-head h3 {
  margin: 0;
  font-size: 18px;
}

.block-head span {
  margin-top: 6px;
  display: block;
  color: var(--text-sub);
  font-size: 12px;
}

.entry-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.form-inline {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.head-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.keyword {
  width: 220px;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 670px;
  overflow: auto;
  padding-right: 4px;
}

.entry-card {
  border: 1px solid #dce1cd;
  border-radius: 14px;
  padding: 12px;
  background: #fbfcf7;
}

.entry-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.entry-head h4 {
  margin: 0;
  font-size: 16px;
}

.entry-head span {
  margin-top: 4px;
  display: block;
  color: var(--text-sub);
  font-size: 12px;
}

.entry-section {
  margin-top: 10px;
}

.entry-section label {
  display: block;
  font-size: 12px;
  color: #6a7058;
}

.entry-section p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #404734;
  white-space: pre-wrap;
}

.entry-foot {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.tip {
  font-size: 12px;
  color: #5a7b30;
}

.tip.warning {
  color: #c2410c;
}

.empty-state {
  margin-top: 30px;
  text-align: center;
  color: var(--text-sub);
  font-size: 13px;
}

@media (max-width: 1320px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .principles-grid {
    grid-template-columns: 1fr;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .diary-page {
    padding: 14px;
  }

  .hero-left h1 {
    font-size: 28px;
  }

  .form-inline {
    grid-template-columns: 1fr;
  }

  .head-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .keyword {
    width: 100%;
  }
}
</style>
