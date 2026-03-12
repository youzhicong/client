<template>
  <div class="meal-page">
    <div class="hero panel">
      <div class="hero-text">
        <p class="hero-kicker">MEAL LOTTERY</p>
        <h1>今天三餐吃什么</h1>
        <p>
          早中晚独立奖池，支持单独抽取和一键生成。你也可以自己加菜，做成你自己的日常吃饭决策器。
        </p>
      </div>
      <div class="hero-actions">
        <el-button
          type="primary"
          :icon="Food"
          :loading="drawing"
          @click="drawAllMeals"
        >
          一键抽三餐
        </el-button>
        <el-button
          :icon="RefreshRight"
          :disabled="drawing"
          @click="clearResult"
        >
          清空今日结果
        </el-button>
        <el-button :disabled="drawing" @click="resetPools"
          >恢复默认奖池</el-button
        >
      </div>
    </div>

    <el-row :gutter="14" class="stats-row">
      <el-col v-for="meal in mealConfigs" :key="meal.key" :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-main">
            <div class="stat-icon" :class="meal.key">
              <el-icon><component :is="meal.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-title">{{ meal.title }}奖池</div>
              <div class="stat-value">{{ pools[meal.key].length }} 道</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="result-header">
          <span>今日推荐 · {{ todayLabel }}</span>
          <el-tag :type="hasResult ? 'success' : 'info'" effect="light">
            {{ hasResult ? '已生成' : '待抽取' }}
          </el-tag>
        </div>
      </template>

      <div class="result-grid">
        <div v-for="meal in mealConfigs" :key="meal.key" class="result-item">
          <div class="result-title">
            <el-icon><component :is="meal.icon" /></el-icon>
            <span>{{ meal.title }}</span>
          </div>
          <div
            class="result-value"
            :class="{
              empty: !drawResult[meal.key],
              rolling: rolling[meal.key]
            }"
          >
            {{ drawResult[meal.key] || '还没想好吃什么' }}
          </div>
          <el-button
            size="small"
            :loading="rolling[meal.key]"
            :disabled="drawing && !rolling[meal.key]"
            @click="drawSingleMeal(meal.key)"
          >
            抽{{ meal.title }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="14" class="pool-row">
      <el-col v-for="meal in mealConfigs" :key="meal.key" :span="8">
        <el-card class="pool-card" shadow="never">
          <template #header>
            <div class="pool-header">
              <div class="pool-title">
                <el-icon><component :is="meal.icon" /></el-icon>
                <span>{{ meal.title }}奖池</span>
              </div>
              <el-tag size="small" effect="plain"
                >{{ pools[meal.key].length }} 项</el-tag
              >
            </div>
          </template>

          <div class="input-row">
            <el-input
              v-model="drafts[meal.key]"
              :placeholder="meal.placeholder"
              @keyup.enter="addDish(meal.key)"
            />
            <el-button type="primary" plain @click="addDish(meal.key)">
              添加
            </el-button>
          </div>

          <div class="tag-list">
            <el-tag
              v-for="dish in pools[meal.key]"
              :key="`${meal.key}-${dish}`"
              closable
              effect="light"
              @close="removeDish(meal.key, dish)"
            >
              {{ dish }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="history-header">
          <span>抽奖历史</span>
          <el-button
            size="small"
            type="danger"
            link
            :disabled="!history.length"
            @click="clearHistory"
          >
            清空历史
          </el-button>
        </div>
      </template>

      <el-empty v-if="!history.length" description="还没有抽奖记录" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in displayedHistory"
          :key="item.id"
          :timestamp="item.time"
        >
          <div class="history-text">
            <strong>{{ item.mealLabel }}</strong>
            <span>抽到</span>
            <span class="history-dish">{{ item.dish }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bowl,
  Chicken,
  CoffeeCup,
  Food,
  RefreshRight
} from '@element-plus/icons-vue'

type MealKey = 'breakfast' | 'lunch' | 'dinner'
type MealResult = Record<MealKey, string>
type MealPools = Record<MealKey, string[]>
type RollingState = Record<MealKey, boolean>

interface MealHistoryItem {
  id: string
  meal: MealKey
  mealLabel: string
  dish: string
  time: string
}

interface StorageState {
  pools: MealPools
  result: MealResult
  resultDate: string
  history: MealHistoryItem[]
}

const STORAGE_KEY = 'meal-lottery-state-v1'
const mealOrder: MealKey[] = ['breakfast', 'lunch', 'dinner']

const mealLabelMap: Record<MealKey, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}

const mealConfigs = [
  {
    key: 'breakfast' as MealKey,
    title: '早餐',
    icon: CoffeeCup,
    placeholder: '比如：豆浆油条、鸡蛋三明治'
  },
  {
    key: 'lunch' as MealKey,
    title: '午餐',
    icon: Bowl,
    placeholder: '比如：黄焖鸡米饭、兰州拉面'
  },
  {
    key: 'dinner' as MealKey,
    title: '晚餐',
    icon: Chicken,
    placeholder: '比如：番茄牛腩饭、烤鱼'
  }
]

const createDefaultPools = (): MealPools => ({
  breakfast: [
    '豆浆油条',
    '牛奶燕麦',
    '鸡蛋三明治',
    '小米粥+包子',
    '煎饼果子',
    '手抓饼',
    '热干面',
    '肠粉',
    '馄饨',
    '皮蛋瘦肉粥',
    '全麦面包+酸奶',
    '鸡蛋灌饼',
    '生煎包',
    '南瓜粥+蒸饺',
    '麦片水果碗'
  ],
  lunch: [
    '黄焖鸡米饭',
    '宫保鸡丁盖饭',
    '番茄牛腩饭',
    '麻辣烫',
    '兰州拉面',
    '酸菜鱼',
    '咖喱鸡饭',
    '烧腊双拼饭',
    '煲仔饭',
    '寿司定食',
    '砂锅米线',
    '水煮肉片',
    '番茄鸡蛋面',
    '香锅',
    '烤鱼'
  ],
  dinner: [
    '蒜香烤鸡腿',
    '冬阴功汤面',
    '牛肉粉',
    '饺子',
    '石锅拌饭',
    '寿喜锅',
    '西红柿炖牛腩',
    '清炒时蔬+鸡胸肉',
    '炒河粉',
    '重庆小面',
    '意面',
    '麻辣香锅',
    '寿司',
    '铁板烧',
    '菌菇鸡汤面'
  ]
})

const createEmptyResult = (): MealResult => ({
  breakfast: '',
  lunch: '',
  dinner: ''
})

const createRollingState = (): RollingState => ({
  breakfast: false,
  lunch: false,
  dinner: false
})

const pools = ref<MealPools>(createDefaultPools())
const drawResult = ref<MealResult>(createEmptyResult())
const rolling = ref<RollingState>(createRollingState())
const history = ref<MealHistoryItem[]>([])
const resultDate = ref('')
const drawing = ref(false)

const drafts = reactive<Record<MealKey, string>>({
  breakfast: '',
  lunch: '',
  dinner: ''
})

const getTodayKey = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatNow = () =>
  new Date().toLocaleString('zh-CN', {
    hour12: false
  })

const sleep = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

const normalizeDish = (value: string) => value.trim().replace(/\s+/g, ' ')

const dedupeDishes = (items: string[]) =>
  Array.from(
    new Set(items.map((item) => normalizeDish(item)).filter((item) => !!item))
  )

const pickRandom = (items: string[]) =>
  items[Math.floor(Math.random() * items.length)] || ''

const todayKey = computed(() => getTodayKey())
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  }).format(new Date())
)

const hasResult = computed(() =>
  mealOrder.some((meal) => !!drawResult.value[meal])
)

const displayedHistory = computed(() => history.value.slice(0, 30))

const addDish = (meal: MealKey) => {
  const value = normalizeDish(drafts[meal])
  if (!value) {
    ElMessage.warning(`请输入要加入${mealLabelMap[meal]}奖池的菜品`)
    return
  }
  if (pools.value[meal].includes(value)) {
    ElMessage.info('这个菜已经在奖池里了')
    return
  }
  pools.value[meal] = [...pools.value[meal], value]
  drafts[meal] = ''
  ElMessage.success(`已添加到${mealLabelMap[meal]}奖池`)
}

const removeDish = (meal: MealKey, dish: string) => {
  pools.value[meal] = pools.value[meal].filter((item) => item !== dish)
  if (drawResult.value[meal] === dish) {
    drawResult.value[meal] = ''
  }
}

const pushHistory = (meal: MealKey, dish: string) => {
  history.value.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    meal,
    mealLabel: mealLabelMap[meal],
    dish,
    time: formatNow()
  })
  if (history.value.length > 100) {
    history.value = history.value.slice(0, 100)
  }
}

const animateDraw = async (
  meal: MealKey,
  pool: string[],
  finalDish: string
) => {
  rolling.value[meal] = true
  for (let index = 0; index < 12; index += 1) {
    drawResult.value[meal] = pickRandom(pool)
    await sleep(70)
  }
  drawResult.value[meal] = finalDish
  rolling.value[meal] = false
}

const drawSingleMeal = async (meal: MealKey) => {
  if (drawing.value) return
  const pool = pools.value[meal]
  if (!pool.length) {
    ElMessage.warning(`${mealLabelMap[meal]}奖池是空的，请先添加菜品`)
    return
  }

  drawing.value = true
  try {
    const finalDish = pickRandom(pool)
    await animateDraw(meal, pool, finalDish)
    resultDate.value = todayKey.value
    pushHistory(meal, finalDish)
    ElMessage.success(`${mealLabelMap[meal]}：${finalDish}`)
  } finally {
    drawing.value = false
  }
}

const drawAllMeals = async () => {
  if (drawing.value) return

  const emptyMeal = mealOrder.find((meal) => pools.value[meal].length === 0)
  if (emptyMeal) {
    ElMessage.warning(`${mealLabelMap[emptyMeal]}奖池为空，请先补充菜品`)
    return
  }

  drawing.value = true
  try {
    const used = new Set<string>()

    for (const meal of mealOrder) {
      const pool = pools.value[meal]
      const candidates = pool.filter((dish) => !used.has(dish))
      const finalDish = pickRandom(candidates.length ? candidates : pool)
      used.add(finalDish)

      await animateDraw(meal, pool, finalDish)
      pushHistory(meal, finalDish)
    }

    resultDate.value = todayKey.value
    ElMessage.success('今日三餐已生成，开吃')
  } finally {
    drawing.value = false
  }
}

const clearResult = () => {
  drawResult.value = createEmptyResult()
  resultDate.value = todayKey.value
}

const resetPools = async () => {
  try {
    await ElMessageBox.confirm(
      '确认恢复默认奖池？你添加的自定义菜品会被清空。',
      '恢复默认',
      {
        type: 'warning'
      }
    )
    pools.value = createDefaultPools()
    drawResult.value = createEmptyResult()
    Object.assign(drafts, { breakfast: '', lunch: '', dinner: '' })
    resultDate.value = todayKey.value
    ElMessage.success('已恢复默认奖池')
  } catch {
    // canceled
  }
}

const clearHistory = async () => {
  if (!history.value.length) return
  try {
    await ElMessageBox.confirm('确认清空抽奖历史吗？', '清空历史', {
      type: 'warning'
    })
    history.value = []
    ElMessage.success('历史记录已清空')
  } catch {
    // canceled
  }
}

const parsePool = (value: unknown) =>
  Array.isArray(value)
    ? dedupeDishes(
        value.filter((item): item is string => typeof item === 'string')
      )
    : []

const hydrateState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<StorageState>

    const defaultPools = createDefaultPools()
    const nextPools: MealPools = { ...defaultPools }
    if (parsed.pools && typeof parsed.pools === 'object') {
      for (const meal of mealOrder) {
        const incoming = parsePool((parsed.pools as MealPools)[meal])
        if (incoming.length) {
          nextPools[meal] = incoming
        }
      }
    }
    pools.value = nextPools

    const nextResult = createEmptyResult()
    if (parsed.result && typeof parsed.result === 'object') {
      for (const meal of mealOrder) {
        const incoming = (parsed.result as MealResult)[meal]
        if (typeof incoming === 'string') {
          nextResult[meal] = incoming
        }
      }
    }
    drawResult.value = nextResult

    resultDate.value =
      typeof parsed.resultDate === 'string' ? parsed.resultDate : todayKey.value

    if (Array.isArray(parsed.history)) {
      history.value = parsed.history
        .filter((item) => {
          return (
            item &&
            typeof item === 'object' &&
            typeof (item as MealHistoryItem).id === 'string' &&
            typeof (item as MealHistoryItem).meal === 'string' &&
            typeof (item as MealHistoryItem).mealLabel === 'string' &&
            typeof (item as MealHistoryItem).dish === 'string' &&
            typeof (item as MealHistoryItem).time === 'string'
          )
        })
        .slice(0, 100) as MealHistoryItem[]
    }

    if (resultDate.value !== todayKey.value) {
      drawResult.value = createEmptyResult()
      resultDate.value = todayKey.value
    }
  } catch {
    pools.value = createDefaultPools()
    drawResult.value = createEmptyResult()
    history.value = []
    resultDate.value = todayKey.value
  }
}

const persistState = () => {
  const state: StorageState = {
    pools: pools.value,
    result: drawResult.value,
    resultDate: resultDate.value || todayKey.value,
    history: history.value.slice(0, 100)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

onMounted(() => {
  hydrateState()
})

watch([pools, drawResult, history, resultDate], persistState, {
  deep: true
})
</script>

<style lang="scss" scoped>
.meal-page {
  padding: 22px 24px 34px;
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(
      circle at 8% 0%,
      rgba(252, 211, 77, 0.2) 0%,
      transparent 35%
    ),
    radial-gradient(
      circle at 100% 10%,
      rgba(34, 197, 94, 0.16) 0%,
      transparent 34%
    ),
    #f8fafc;
}

.hero {
  margin-bottom: 14px;
  padding: 24px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #0f766e 100%);
  color: #e2e8f0;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: rgba(191, 219, 254, 0.95);
}

.hero h1 {
  margin: 0;
  font-size: 30px;
}

.hero p {
  margin: 10px 0 0;
  max-width: 720px;
  line-height: 1.7;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.9);
}

.hero-actions {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.stats-row {
  margin-bottom: 14px;
}

.stat-card {
  border-radius: 14px;
}

.stat-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
}

.stat-icon.breakfast {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.stat-icon.lunch {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
}

.stat-icon.dinner {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.stat-title {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.result-card {
  margin-bottom: 14px;
  border-radius: 14px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.result-item {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #334155;
  font-weight: 600;
  margin-bottom: 10px;
}

.result-value {
  min-height: 48px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #dbeafe;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.45;
}

.result-value.empty {
  color: #94a3b8;
  font-weight: 500;
}

.result-value.rolling {
  animation: blink 0.35s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    transform: scale(1);
    background: #fff;
  }
  50% {
    transform: scale(1.02);
    background: #e0f2fe;
  }
}

.pool-row {
  margin-bottom: 14px;
}

.pool-card {
  border-radius: 14px;
  height: 100%;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.pool-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1e293b;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
}

.tag-list::-webkit-scrollbar {
  width: 4px;
}

.tag-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.history-card {
  border-radius: 14px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
}

.history-dish {
  color: #1d4ed8;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .meal-page {
    padding: 18px 14px 28px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .stats-row :deep(.el-col) {
    margin-bottom: 10px;
  }

  .pool-row :deep(.el-col) {
    margin-bottom: 10px;
  }

  .hero h1 {
    font-size: 24px;
  }
}
</style>
