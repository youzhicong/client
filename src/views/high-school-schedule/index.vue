<template>
  <div class="schedule-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div>
          <p class="hero-kicker">高中老师课表</p>
          <h1 class="hero-title">课程列表</h1>
          <p class="hero-desc">支持课程新增、修改、导入导出和老师之间调课。</p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            新增课程
          </el-button>
          <el-button
            :icon="Sort"
            :disabled="selectedCourses.length !== 2"
            @click="openSwapDialog"
          >
            老师调课
          </el-button>
          <el-button :icon="Upload" @click="triggerImport">导入 CSV</el-button>
          <el-button :icon="Download" @click="exportCsv">导出 CSV</el-button>
          <el-button @click="restoreSeedData">恢复样例</el-button>
        </div>
      </div>
    </el-card>

    <input
      ref="fileInputRef"
      class="hidden-file-input"
      type="file"
      accept=".csv,text/csv"
      @change="onFileChange"
    />

    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="搜索老师/科目/班级/教室"
          style="width: 280px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filters.grade"
          clearable
          placeholder="年级"
          style="width: 120px"
        >
          <el-option
            v-for="grade in gradeOptions"
            :key="grade"
            :label="grade"
            :value="grade"
          />
        </el-select>
        <el-select
          v-model="filters.weekday"
          clearable
          placeholder="星期"
          style="width: 120px"
        >
          <el-option
            v-for="weekday in weekdayOptions"
            :key="weekday"
            :label="weekday"
            :value="weekday"
          />
        </el-select>
        <el-text class="tip-text" size="small" type="info">
          勾选 2 条课程后可进行老师调课
        </el-text>
      </div>
      <div class="import-tip">
        导入列顺序：教师, 科目, 年级, 班级, 星期, 节次, 教室
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <AppDataTable
        ref="tableRef"
        :data="pagedCourses"
        row-key="id"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="52" align="center" />
        <el-table-column label="序号" width="72" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="老师" min-width="120" />
        <el-table-column prop="subject" label="科目" min-width="110" />
        <el-table-column prop="grade" label="年级" min-width="90" />
        <el-table-column prop="className" label="班级" min-width="100" />
        <el-table-column prop="weekday" label="星期" min-width="90" />
        <el-table-column prop="period" label="节次" min-width="110" />
        <el-table-column prop="classroom" label="教室" min-width="110" />
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              text
              :icon="EditPen"
              @click="openEditDialog(row)"
            >
              修改
            </el-button>
            <el-button type="danger" text @click="removeCourse(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无课程数据" />
        </template>
      </AppDataTable>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredCourses.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>

      <div v-if="swapLogs.length" class="log-wrap">
        <div class="log-title">最近调课记录</div>
        <el-timeline>
          <el-timeline-item
            v-for="log in swapLogs"
            :key="log.id"
            :timestamp="log.timestamp"
            placement="top"
          >
            <div class="log-item">
              <div>{{ log.summary }}</div>
              <div class="log-reason">原因：{{ log.reason || '未填写' }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '修改课程' : '新增课程'"
      width="560px"
      @closed="onDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
      >
        <el-form-item label="老师" prop="teacherName">
          <el-input
            v-model="formData.teacherName"
            placeholder="请输入老师姓名"
          />
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-input v-model="formData.subject" placeholder="请输入科目" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="formData.grade" style="width: 100%">
            <el-option
              v-for="grade in gradeOptions"
              :key="grade"
              :label="grade"
              :value="grade"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model="formData.className" placeholder="例如：1班" />
        </el-form-item>
        <el-form-item label="星期" prop="weekday">
          <el-select v-model="formData.weekday" style="width: 100%">
            <el-option
              v-for="weekday in weekdayOptions"
              :key="weekday"
              :label="weekday"
              :value="weekday"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="节次" prop="period">
          <el-input v-model="formData.period" placeholder="例如：第1节" />
        </el-form-item>
        <el-form-item label="教室" prop="classroom">
          <el-input
            v-model="formData.classroom"
            placeholder="例如：高一(1)班 / A201"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="swapDialogVisible"
      title="老师调课"
      width="640px"
      @closed="onSwapDialogClosed"
    >
      <template v-if="selectedCourses.length === 2">
        <div class="swap-pair">
          <div class="swap-card">
            <div class="swap-card-title">课程 A</div>
            <div>
              {{ selectedCourses[0]?.teacherName }} /
              {{ selectedCourses[0]?.subject }}
            </div>
            <div>
              {{ selectedCourses[0]?.grade }}{{ selectedCourses[0]?.className }}
            </div>
            <div>
              {{ selectedCourses[0]?.weekday }} {{ selectedCourses[0]?.period }}
            </div>
            <div>{{ selectedCourses[0]?.classroom }}</div>
          </div>
          <div class="swap-card">
            <div class="swap-card-title">课程 B</div>
            <div>
              {{ selectedCourses[1]?.teacherName }} /
              {{ selectedCourses[1]?.subject }}
            </div>
            <div>
              {{ selectedCourses[1]?.grade }}{{ selectedCourses[1]?.className }}
            </div>
            <div>
              {{ selectedCourses[1]?.weekday }} {{ selectedCourses[1]?.period }}
            </div>
            <div>{{ selectedCourses[1]?.classroom }}</div>
          </div>
        </div>

        <el-form label-width="90px">
          <el-form-item label="调课方式">
            <el-radio-group v-model="swapMode">
              <el-radio value="timeslot">互换上课时间</el-radio>
              <el-radio value="teacher">互换授课老师</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="调课原因">
            <el-input
              v-model="swapReason"
              maxlength="60"
              show-word-limit
              placeholder="可选，例如：外出培训、临时请假"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="swapDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSwap">确认调课</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Download,
  EditPen,
  Plus,
  Search,
  Sort,
  Upload
} from '@element-plus/icons-vue'

type Grade = '高一' | '高二' | '高三'
type Weekday = '周一' | '周二' | '周三' | '周四' | '周五'
type SwapMode = 'timeslot' | 'teacher'

interface CourseItem {
  id: string
  teacherName: string
  subject: string
  grade: Grade
  className: string
  weekday: Weekday
  period: string
  classroom: string
}

interface CourseForm {
  id: string
  teacherName: string
  subject: string
  grade: Grade
  className: string
  weekday: Weekday
  period: string
  classroom: string
}

interface SwapLogItem {
  id: string
  timestamp: string
  summary: string
  reason: string
}

const STORAGE_KEY = 'high-school-teacher-schedule-v1'
const SWAP_LOG_KEY = 'high-school-teacher-schedule-swap-log-v1'

const gradeOptions: Grade[] = ['高一', '高二', '高三']
const weekdayOptions: Weekday[] = ['周一', '周二', '周三', '周四', '周五']
const csvFieldOrder: Array<keyof Omit<CourseItem, 'id'>> = [
  'teacherName',
  'subject',
  'grade',
  'className',
  'weekday',
  'period',
  'classroom'
]

const seedCourses: CourseItem[] = [
  {
    id: 'course-1',
    teacherName: '王老师',
    subject: '语文',
    grade: '高一',
    className: '1班',
    weekday: '周一',
    period: '第1节',
    classroom: '高一(1)班'
  },
  {
    id: 'course-2',
    teacherName: '李老师',
    subject: '数学',
    grade: '高一',
    className: '2班',
    weekday: '周一',
    period: '第2节',
    classroom: '高一(2)班'
  },
  {
    id: 'course-3',
    teacherName: '陈老师',
    subject: '英语',
    grade: '高二',
    className: '3班',
    weekday: '周二',
    period: '第3节',
    classroom: '高二(3)班'
  },
  {
    id: 'course-4',
    teacherName: '赵老师',
    subject: '物理',
    grade: '高二',
    className: '1班',
    weekday: '周三',
    period: '第2节',
    classroom: '实验楼 302'
  },
  {
    id: 'course-5',
    teacherName: '周老师',
    subject: '化学',
    grade: '高三',
    className: '2班',
    weekday: '周四',
    period: '第4节',
    classroom: '实验楼 205'
  },
  {
    id: 'course-6',
    teacherName: '孙老师',
    subject: '生物',
    grade: '高三',
    className: '1班',
    weekday: '周五',
    period: '第1节',
    classroom: '高三(1)班'
  }
]

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''
const isGrade = (value: string): value is Grade =>
  gradeOptions.includes(value as Grade)
const isWeekday = (value: string): value is Weekday =>
  weekdayOptions.includes(value as Weekday)
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const cloneSeedCourses = () => seedCourses.map((item) => ({ ...item }))
const nowText = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const normalizeCourse = (source: unknown): CourseItem | null => {
  if (!source || typeof source !== 'object') {
    return null
  }

  const record = source as Record<string, unknown>
  const teacherName = normalizeText(record.teacherName)
  const subject = normalizeText(record.subject)
  const grade = normalizeText(record.grade)
  const className = normalizeText(record.className)
  const weekday = normalizeText(record.weekday)
  const period = normalizeText(record.period)
  const classroom = normalizeText(record.classroom)

  if (
    !teacherName ||
    !subject ||
    !className ||
    !period ||
    !classroom ||
    !isGrade(grade) ||
    !isWeekday(weekday)
  ) {
    return null
  }

  return {
    id: normalizeText(record.id) || createId(),
    teacherName,
    subject,
    grade,
    className,
    weekday,
    period,
    classroom
  }
}

const loadCourses = (): CourseItem[] => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return cloneSeedCourses()
  }

  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      return cloneSeedCourses()
    }
    const normalized = parsed
      .map((item) => normalizeCourse(item))
      .filter((item): item is CourseItem => Boolean(item))
    return normalized.length ? normalized : cloneSeedCourses()
  } catch {
    return cloneSeedCourses()
  }
}

const loadSwapLogs = (): SwapLogItem[] => {
  const saved = localStorage.getItem(SWAP_LOG_KEY)
  if (!saved) {
    return []
  }
  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }
        const record = item as Record<string, unknown>
        const id = normalizeText(record.id)
        const timestamp = normalizeText(record.timestamp)
        const summary = normalizeText(record.summary)
        const reason = normalizeText(
          record.reason ??
            record.swapReason ??
            record.remark ??
            record.note ??
            record.cause
        )
        if (!id || !timestamp || !summary) {
          return null
        }
        return { id, timestamp, summary, reason }
      })
      .filter((item): item is SwapLogItem => Boolean(item))
  } catch {
    return []
  }
}

const courseList = ref<CourseItem[]>(loadCourses())
const swapLogs = ref<SwapLogItem[]>(loadSwapLogs())
const currentPage = ref(1)
const pageSize = ref(10)
const fileInputRef = ref<HTMLInputElement>()
const tableRef = ref<{ clearSelection: () => void } | null>(null)

const selectedCourses = ref<CourseItem[]>([])
const swapDialogVisible = ref(false)
const swapMode = ref<SwapMode>('timeslot')
const swapReason = ref('')

const filters = reactive({
  keyword: '',
  grade: '',
  weekday: ''
})

const filteredCourses = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return courseList.value.filter((course) => {
    const searchableText = [
      course.teacherName,
      course.subject,
      course.className,
      course.classroom
    ]
      .join(' ')
      .toLowerCase()

    const matchKeyword = !keyword || searchableText.includes(keyword)
    const matchGrade = !filters.grade || course.grade === filters.grade
    const matchWeekday = !filters.weekday || course.weekday === filters.weekday

    return matchKeyword && matchGrade && matchWeekday
  })
})

const pagedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

watch(
  courseList,
  (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  },
  { deep: true }
)

watch(
  swapLogs,
  (logs) => {
    localStorage.setItem(SWAP_LOG_KEY, JSON.stringify(logs))
  },
  { deep: true }
)

watch(
  () => [filters.keyword, filters.grade, filters.weekday],
  () => {
    currentPage.value = 1
    clearSelectedCourses()
  }
)

watch([filteredCourses, pageSize], () => {
  const maxPage = Math.max(
    1,
    Math.ceil(filteredCourses.value.length / pageSize.value)
  )
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})

watch([currentPage, pageSize], () => {
  clearSelectedCourses()
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<CourseForm>({
  id: '',
  teacherName: '',
  subject: '',
  grade: '高一',
  className: '',
  weekday: '周一',
  period: '',
  classroom: ''
})

const formRules: FormRules<CourseForm> = {
  teacherName: [{ required: true, message: '请输入老师姓名', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入科目', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  weekday: [{ required: true, message: '请选择星期', trigger: 'change' }],
  period: [{ required: true, message: '请输入节次', trigger: 'blur' }],
  classroom: [{ required: true, message: '请输入教室', trigger: 'blur' }]
}

const resetFormData = () => {
  formData.id = ''
  formData.teacherName = ''
  formData.subject = ''
  formData.grade = '高一'
  formData.className = ''
  formData.weekday = '周一'
  formData.period = ''
  formData.classroom = ''
}

const openCreateDialog = () => {
  isEdit.value = false
  resetFormData()
  dialogVisible.value = true
}

const openEditDialog = (course: CourseItem) => {
  isEdit.value = true
  formData.id = course.id
  formData.teacherName = course.teacherName
  formData.subject = course.subject
  formData.grade = course.grade
  formData.className = course.className
  formData.weekday = course.weekday
  formData.period = course.period
  formData.classroom = course.classroom
  dialogVisible.value = true
}

const onDialogClosed = () => {
  formRef.value?.clearValidate()
}

const saveCourse = async () => {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
    const payload: CourseItem = {
      id: formData.id || createId(),
      teacherName: formData.teacherName.trim(),
      subject: formData.subject.trim(),
      grade: formData.grade,
      className: formData.className.trim(),
      weekday: formData.weekday,
      period: formData.period.trim(),
      classroom: formData.classroom.trim()
    }

    if (isEdit.value) {
      const targetIndex = courseList.value.findIndex(
        (item) => item.id === payload.id
      )
      if (targetIndex > -1) {
        courseList.value.splice(targetIndex, 1, payload)
      } else {
        courseList.value.unshift(payload)
      }
      ElMessage.success('课程已更新')
    } else {
      courseList.value.unshift(payload)
      ElMessage.success('课程已新增')
    }

    dialogVisible.value = false
  } catch {
    // Element Plus 表单验证失败会抛错
  }
}

const removeCourse = (course: CourseItem) => {
  ElMessageBox.confirm(
    `确认删除 ${course.teacherName} 的 ${course.subject}（${course.weekday} ${course.period}）吗？`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }
  )
    .then(() => {
      courseList.value = courseList.value.filter(
        (item) => item.id !== course.id
      )
      clearSelectedCourses()
      ElMessage.success('课程已删除')
    })
    .catch(() => {})
}

const restoreSeedData = () => {
  ElMessageBox.confirm('恢复样例会覆盖当前课表，是否继续？', '恢复确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
    .then(() => {
      courseList.value = cloneSeedCourses()
      swapLogs.value = []
      currentPage.value = 1
      clearSelectedCourses()
      ElMessage.success('已恢复样例课表')
    })
    .catch(() => {})
}

const clearSelectedCourses = () => {
  selectedCourses.value = []
  tableRef.value?.clearSelection()
}

const handleSelectionChange = (rows: CourseItem[]) => {
  selectedCourses.value = rows
}

const openSwapDialog = () => {
  if (selectedCourses.value.length !== 2) {
    ElMessage.warning('请先勾选 2 条课程')
    return
  }
  swapMode.value = 'timeslot'
  swapReason.value = ''
  swapDialogVisible.value = true
}

const onSwapDialogClosed = () => {
  swapMode.value = 'timeslot'
  swapReason.value = ''
}

const confirmSwap = () => {
  if (selectedCourses.value.length !== 2) {
    ElMessage.warning('请先勾选 2 条课程')
    return
  }

  const [firstSelected, secondSelected] = selectedCourses.value
  if (!firstSelected || !secondSelected) {
    ElMessage.warning('请先勾选 2 条课程')
    return
  }

  const firstIndex = courseList.value.findIndex(
    (item) => item.id === firstSelected.id
  )
  const secondIndex = courseList.value.findIndex(
    (item) => item.id === secondSelected.id
  )
  if (firstIndex < 0 || secondIndex < 0) {
    ElMessage.error('调课失败，课程不存在')
    return
  }

  const firstRaw = courseList.value[firstIndex]
  const secondRaw = courseList.value[secondIndex]
  if (!firstRaw || !secondRaw) {
    ElMessage.error('调课失败，课程不存在')
    return
  }

  const firstItem: CourseItem = { ...firstRaw }
  const secondItem: CourseItem = { ...secondRaw }

  let summary = ''
  if (swapMode.value === 'timeslot') {
    const updatedFirst: CourseItem = {
      ...firstItem,
      weekday: secondItem.weekday,
      period: secondItem.period,
      classroom: secondItem.classroom
    }
    const updatedSecond: CourseItem = {
      ...secondItem,
      weekday: firstItem.weekday,
      period: firstItem.period,
      classroom: firstItem.classroom
    }
    courseList.value.splice(firstIndex, 1, updatedFirst)
    courseList.value.splice(secondIndex, 1, updatedSecond)
    summary = `${firstItem.teacherName} 与 ${secondItem.teacherName} 互换上课时间`
    ElMessage.success('已完成换课（时间已互换）')
  } else {
    const updatedFirst: CourseItem = {
      ...firstItem,
      teacherName: secondItem.teacherName
    }
    const updatedSecond: CourseItem = {
      ...secondItem,
      teacherName: firstItem.teacherName
    }
    courseList.value.splice(firstIndex, 1, updatedFirst)
    courseList.value.splice(secondIndex, 1, updatedSecond)
    summary = `${firstItem.teacherName} 与 ${secondItem.teacherName} 互换授课老师`
    ElMessage.success('已完成调课（老师已互换）')
  }

  swapLogs.value.unshift({
    id: createId(),
    timestamp: nowText(),
    summary,
    reason: swapReason.value.trim()
  })
  swapLogs.value = swapLogs.value.slice(0, 10)

  swapDialogVisible.value = false
  clearSelectedCourses()
}

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
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

const normalizeHeader = (header: string) =>
  header.trim().replace(/\s+/g, '').toLowerCase()

const headerAliasMap: Record<string, keyof Omit<CourseItem, 'id'>> = {
  teachername: 'teacherName',
  teacher: 'teacherName',
  教师: 'teacherName',
  老师: 'teacherName',
  subject: 'subject',
  course: 'subject',
  科目: 'subject',
  课程: 'subject',
  grade: 'grade',
  年级: 'grade',
  classname: 'className',
  class: 'className',
  班级: 'className',
  weekday: 'weekday',
  week: 'weekday',
  星期: 'weekday',
  周: 'weekday',
  period: 'period',
  lesson: 'period',
  节次: 'period',
  课时: 'period',
  classroom: 'classroom',
  room: 'classroom',
  教室: 'classroom'
}

const parseCsv = (content: string): CourseItem[] => {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)

  if (!lines.length) {
    return []
  }

  const [headerLine, ...dataLines] = lines
  if (!headerLine) {
    return []
  }

  const headers = parseCsvLine(headerLine).map(
    (header) => headerAliasMap[normalizeHeader(header)]
  )
  const fieldIndexMap = new Map<keyof Omit<CourseItem, 'id'>, number>()

  headers.forEach((field, index) => {
    if (field && !fieldIndexMap.has(field)) {
      fieldIndexMap.set(field, index)
    }
  })

  const missingFields = csvFieldOrder.filter(
    (field) => !fieldIndexMap.has(field)
  )
  if (missingFields.length) {
    throw new Error(`CSV 缺少列：${missingFields.join(', ')}`)
  }

  const result: CourseItem[] = []
  dataLines.forEach((line, lineIndex) => {
    const row = parseCsvLine(line)
    const getField = (field: keyof Omit<CourseItem, 'id'>) => {
      const index = fieldIndexMap.get(field)
      if (index === undefined) {
        return ''
      }
      return normalizeText(row[index])
    }

    const teacherName = getField('teacherName')
    const subject = getField('subject')
    const gradeValue = getField('grade')
    const className = getField('className')
    const weekdayValue = getField('weekday')
    const period = getField('period')
    const classroom = getField('classroom')

    if (
      !teacherName ||
      !subject ||
      !className ||
      !period ||
      !classroom ||
      !isGrade(gradeValue) ||
      !isWeekday(weekdayValue)
    ) {
      throw new Error(
        `第 ${lineIndex + 2} 行数据不合法，请检查必填项/年级/星期`
      )
    }

    result.push({
      id: createId(),
      teacherName,
      subject,
      grade: gradeValue,
      className,
      weekday: weekdayValue,
      period,
      classroom
    })
  })

  return result
}

const triggerImport = () => {
  fileInputRef.value?.click()
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    const content = await file.text()
    const imported = parseCsv(content)
    if (!imported.length) {
      ElMessage.warning('CSV 没有可导入的数据')
      return
    }

    await ElMessageBox.confirm(
      `即将导入 ${imported.length} 条课程并覆盖当前数据，是否继续？`,
      '导入确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )

    courseList.value = imported
    currentPage.value = 1
    clearSelectedCourses()
    ElMessage.success(`已导入 ${imported.length} 条课程`)
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('导入失败，请检查 CSV 文件格式')
    }
  } finally {
    input.value = ''
  }
}

const escapeCsvCell = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const exportCsv = () => {
  if (!courseList.value.length) {
    ElMessage.warning('当前没有可导出的课程数据')
    return
  }

  const header = ['教师', '科目', '年级', '班级', '星期', '节次', '教室']
  const lines = [header.join(',')]

  courseList.value.forEach((course) => {
    lines.push(
      [
        course.teacherName,
        course.subject,
        course.grade,
        course.className,
        course.weekday,
        course.period,
        course.classroom
      ]
        .map(escapeCsvCell)
        .join(',')
    )
  })

  const csvContent = `\uFEFF${lines.join('\n')}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `高中老师课表-${formatDate(new Date())}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
  ElMessage.success('课表已导出')
}
</script>

<style lang="scss" scoped>
.schedule-page {
  padding: 24px 28px 36px;
  min-height: calc(100vh - 64px);
  background: radial-gradient(circle at top right, #e5efff 0%, #ffffff 55%);
}

.hero-card {
  margin-bottom: 16px;
  background: linear-gradient(130deg, #0b1f3a 0%, #184c74 55%, #0a6b67 100%);
  border: 0;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  color: #f8fafc;
}

.hero-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(248, 250, 252, 0.75);
}

.hero-title {
  margin: 6px 0 8px;
  font-size: 28px;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(248, 250, 252, 0.85);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hidden-file-input {
  display: none;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.tip-text {
  margin-left: auto;
}

.import-tip {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.log-wrap {
  border-top: 1px solid #e2e8f0;
  margin: 0 16px 16px;
  padding-top: 14px;
}

.log-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.log-item {
  color: #334155;
}

.log-reason {
  font-size: 12px;
  margin-top: 4px;
  color: #64748b;
}

.swap-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.swap-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  line-height: 1.7;
  color: #334155;
}

.swap-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

@media (max-width: 980px) {
  .schedule-page {
    padding: 18px 14px 28px;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .tip-text {
    margin-left: 0;
    width: 100%;
  }

  .swap-pair {
    grid-template-columns: 1fr;
  }
}
</style>
