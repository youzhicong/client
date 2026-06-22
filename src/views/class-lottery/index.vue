<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="CLASSROOM RANDOM CALL"
        title="上课抽奖提问"
        description="先导入学生名单（会通过后端接口保存），老师点击抽奖即可随机点名提问，支持本轮不重复。"
      >
        <template #actions>
          <el-button
            type="primary"
            :icon="Upload"
            :loading="importing"
            @click="triggerImport"
          >
            导入学生名单
          </el-button>
          <el-button :icon="Download" @click="downloadTemplate">
            下载模板
          </el-button>
          <el-button :icon="RefreshRight" @click="resetRound">
            重置轮次
          </el-button>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid>
        <PageStatCard label="学生总数" :value="students.length" />
        <PageStatCard label="本轮已点名" :value="calledCount" />
        <PageStatCard label="本轮剩余" :value="remainingCount" />
      </PageStatGrid>
    </template>

    <input
      ref="fileInputRef"
      class="hidden-file-input"
      type="file"
      accept=".csv,.txt,text/csv,text/plain"
      @change="onFileChange"
    />

    <el-row :gutter="14" class="main-row">
      <el-col :span="14">
        <el-card class="draw-card" shadow="never">
          <template #header>
            <div class="draw-header">
              <div>
                <strong>当前抽奖结果</strong>
                <p>第 {{ roundNo }} 轮点名</p>
              </div>
              <el-tag :type="drawing ? 'warning' : 'success'" effect="light">
                {{ drawing ? '抽奖中...' : '准备就绪' }}
              </el-tag>
            </div>
          </template>

          <div class="draw-panel">
            <div class="draw-name" :class="{ rolling: drawing }">
              {{ displayName }}
            </div>
            <div class="draw-actions">
              <el-button
                type="primary"
                size="large"
                :icon="Pointer"
                :loading="drawing"
                :disabled="!students.length"
                @click="drawStudent"
              >
                抽取提问
              </el-button>
              <el-button
                :disabled="drawing || !history.length"
                @click="clearHistory"
              >
                清空历史
              </el-button>
            </div>
            <p class="draw-tip">
              <span v-if="updatedAt">
                最近一次名单更新时间：{{ updatedAt }}
              </span>
              <span v-else>还没有获取到名单数据</span>
            </p>
          </div>
        </el-card>

        <el-card class="history-card" shadow="never">
          <template #header>
            <div class="history-header">
              <span>提问历史（最近 30 条）</span>
              <el-tag type="info" effect="plain"
                >{{ displayHistory.length }} 条</el-tag
              >
            </div>
          </template>

          <el-empty
            v-if="!displayHistory.length"
            description="还没有点名记录"
          />
          <el-timeline v-else>
            <el-timeline-item
              v-for="item in displayHistory"
              :key="item.id"
              :timestamp="item.time"
            >
              <div class="history-line">
                <span class="round-tag">第{{ item.round }}轮</span>
                <span>点到</span>
                <strong>{{ item.name }}</strong>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="student-card" shadow="never">
          <template #header>
            <div class="student-header">
              <span>学生名单</span>
              <el-tag effect="plain">{{ students.length }} 人</el-tag>
            </div>
          </template>

          <div class="student-input-row">
            <el-input
              v-model="draftName"
              :disabled="savingStudents"
              placeholder="手动添加学生姓名"
              @keyup.enter="addStudent"
            />
            <el-button
              type="primary"
              plain
              :loading="savingStudents"
              @click="addStudent"
            >
              添加
            </el-button>
          </div>

          <div class="student-tags">
            <el-tag
              v-for="student in students"
              :key="student.id"
              closable
              effect="light"
              @close="removeStudent(student.name)"
            >
              {{ student.name }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </PageShell>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  Pointer,
  RefreshRight,
  Upload
} from '@element-plus/icons-vue'
import PageHero from '@/components/page/PageHero.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'
import {
  getClassStudents,
  saveClassStudents,
  type ClassStudent
} from '@/services/classLottery'
import { getApiErrorMessage } from '@/utils/request'

interface DrawHistoryItem {
  id: string
  name: string
  round: number
  time: string
}

const fileInputRef = ref<HTMLInputElement>()
const students = ref<ClassStudent[]>([])
const updatedAt = ref('')
const loadingStudents = ref(false)
const savingStudents = ref(false)
const importing = ref(false)
const drawing = ref(false)

const currentPicked = ref('')
const rollingName = ref('')
const draftName = ref('')
const roundNo = ref(1)
const roundPicked = ref<string[]>([])
const history = ref<DrawHistoryItem[]>([])

const calledCount = computed(() => roundPicked.value.length)
const remainingCount = computed(() =>
  Math.max(0, students.value.length - roundPicked.value.length)
)
const displayHistory = computed(() => history.value.slice(0, 30))
const displayName = computed(() => {
  if (drawing.value) return rollingName.value || '抽奖中...'
  return currentPicked.value || '点击“抽取提问”开始'
})
const remainingStudents = computed(() =>
  students.value.filter((student) => !roundPicked.value.includes(student.name))
)

const normalizeName = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

const normalizeList = (names: string[]) => {
  const set = new Set<string>()
  const result: string[] = []
  for (const rawName of names) {
    const name = normalizeName(rawName)
    if (!name) continue
    const lower = name.toLowerCase()
    if (['姓名', '名字', 'name', 'student', 'studentname'].includes(lower)) {
      continue
    }
    if (set.has(name)) continue
    set.add(name)
    result.push(name)
  }
  return result
}

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      const next = line[index + 1]
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

const parseImportedNames = (content: string) => {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !!line)

  if (!lines.length) return []

  const rows = lines.map((line) => parseCsvLine(line))
  const headerAliases = new Set(['姓名', 'name', 'studentname', '学生姓名'])
  const firstRow = rows[0] || []
  const nameColumn = firstRow.findIndex((cell) =>
    headerAliases.has(normalizeName(cell).toLowerCase())
  )

  const names: string[] = []
  const start = nameColumn >= 0 ? 1 : 0

  for (let rowIndex = start; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    if (!row || !row.length) continue

    let candidate = ''
    if (nameColumn >= 0) {
      candidate = row[nameColumn] || ''
    } else if (row.length === 1) {
      candidate = row[0] || ''
    } else {
      candidate =
        row.find((cell) => {
          const value = normalizeName(cell)
          if (!value) return false
          if (/^\d+$/.test(value)) return false
          if (/^(id|学号|序号|no)$/i.test(value)) return false
          return true
        }) || ''
    }
    if (candidate) names.push(candidate)
  }

  const normalized = normalizeList(names)
  if (normalized.length) return normalized

  return normalizeList(content.split(/[\r\n,，;；\t]/))
}

const pickRandom = (list: ClassStudent[]) => {
  return list[Math.floor(Math.random() * list.length)] as ClassStudent
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const nowText = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const applyStudentSnapshot = (data: {
  list: ClassStudent[]
  updatedAt: string
}) => {
  students.value = data.list
  updatedAt.value = data.updatedAt

  const currentNameSet = new Set(students.value.map((item) => item.name))
  roundPicked.value = roundPicked.value.filter((name) =>
    currentNameSet.has(name)
  )
  history.value = history.value.filter((item) => currentNameSet.has(item.name))
  if (currentPicked.value && !currentNameSet.has(currentPicked.value)) {
    currentPicked.value = ''
  }
}

const syncStudentsFromServer = async () => {
  loadingStudents.value = true
  try {
    const response = await getClassStudents()
    applyStudentSnapshot(response.data)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '获取学生名单失败'))
  } finally {
    loadingStudents.value = false
  }
}

const saveNameList = async (names: string[], successText?: string) => {
  savingStudents.value = true
  try {
    const response = await saveClassStudents(normalizeList(names))
    applyStudentSnapshot(response.data)

    if (successText) {
      ElMessage.success(successText)
    }
  } finally {
    savingStudents.value = false
  }
}

const triggerImport = () => {
  fileInputRef.value?.click()
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const content = await file.text()
    const names = parseImportedNames(content)
    if (!names.length) {
      ElMessage.warning('没有解析到有效学生姓名，请检查文件内容')
      return
    }

    await ElMessageBox.confirm(
      `将导入 ${names.length} 位学生并覆盖当前名单，是否继续？`,
      '导入确认',
      {
        type: 'warning',
        confirmButtonText: '继续导入',
        cancelButtonText: '取消'
      }
    )

    await saveNameList(names, `已导入 ${names.length} 位学生`)
    roundPicked.value = []
    currentPicked.value = ''
    roundNo.value = 1
    history.value = []
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(getApiErrorMessage(error, '导入失败，请检查文件格式'))
  } finally {
    importing.value = false
    input.value = ''
  }
}

const addStudent = async () => {
  const name = normalizeName(draftName.value)
  if (!name) {
    ElMessage.warning('请输入学生姓名')
    return
  }
  if (students.value.some((student) => student.name === name)) {
    ElMessage.info('该学生已在名单中')
    return
  }

  try {
    await saveNameList(
      [...students.value.map((item) => item.name), name],
      '已添加学生'
    )
    draftName.value = ''
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '添加失败'))
  }
}

const removeStudent = async (name: string) => {
  const nextNames = students.value
    .map((item) => item.name)
    .filter((studentName) => studentName !== name)

  if (!nextNames.length) {
    ElMessage.warning('名单至少保留一位学生')
    return
  }

  try {
    await saveNameList(nextNames, '已删除学生')
    roundPicked.value = roundPicked.value.filter((item) => item !== name)
    history.value = history.value.filter((item) => item.name !== name)
    if (currentPicked.value === name) {
      currentPicked.value = ''
    }
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '删除失败'))
  }
}

const drawStudent = async () => {
  if (drawing.value) return
  if (!students.value.length) {
    ElMessage.warning('请先导入学生名单')
    return
  }

  let candidates = remainingStudents.value
  if (!candidates.length) {
    roundNo.value += 1
    roundPicked.value = []
    candidates = students.value
    ElMessage.info('上一轮已点完，自动开始新一轮')
  }

  drawing.value = true
  try {
    for (let index = 0; index < 16; index += 1) {
      const random = pickRandom(candidates)
      rollingName.value = random.name
      await sleep(75)
    }

    const finalStudent = pickRandom(candidates)
    currentPicked.value = finalStudent.name
    rollingName.value = finalStudent.name
    if (!roundPicked.value.includes(finalStudent.name)) {
      roundPicked.value.push(finalStudent.name)
    }

    history.value.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: finalStudent.name,
      round: roundNo.value,
      time: nowText()
    })
    history.value = history.value.slice(0, 100)

    ElMessage.success(`请 ${finalStudent.name} 同学回答`)
  } finally {
    drawing.value = false
  }
}

const resetRound = () => {
  roundNo.value += 1
  roundPicked.value = []
  currentPicked.value = ''
  rollingName.value = ''
  ElMessage.success('已重置点名轮次')
}

const clearHistory = () => {
  history.value = []
}

const downloadTemplate = () => {
  const csv = '\uFEFF姓名\n张三\n李四\n王五\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '学生名单模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  syncStudentsFromServer()
})
</script>

<style lang="scss" scoped>
@use '@/style/page-shell.scss';

.hidden-file-input {
  display: none;
}

.main-row {
  margin-top: 12px;
  margin-bottom: 14px;
}

.draw-card,
.history-card,
.student-card {
  border-radius: 14px;
}

.draw-card {
  margin-bottom: 14px;
}

.draw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.draw-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.draw-panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.draw-name {
  height: 88px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #dbeafe;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  display: grid;
  place-items: center;
  letter-spacing: 0.02em;
}

.draw-name.rolling {
  animation: pulse 0.25s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    background: #fff;
  }
  50% {
    transform: scale(1.01);
    background: #dbeafe;
  }
}

.draw-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.draw-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #64748b;
}

.history-header,
.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
}

.round-tag {
  color: #0f766e;
}

.student-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.student-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 486px;
  overflow-y: auto;
  padding-right: 2px;
}

.student-tags::-webkit-scrollbar {
  width: 4px;
}

.student-tags::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

@media (max-width: 1200px) {
  .class-lottery-page {
    padding: 18px 14px 28px;
  }

  .summary-row :deep(.el-col),
  .main-row :deep(.el-col) {
    margin-bottom: 10px;
  }

  .hero-text h1 {
    font-size: 24px;
  }
}
</style>
