<template>
  <div class="company-lottery-page">
    <section class="hero-band">
      <div class="hero-copy">
        <p class="hero-kicker">ANNUAL PARTY LOTTERY</p>
        <h1>年会抽奖现场</h1>
        <p class="hero-desc">
          面向活动大屏和主持台的抽奖工作区。奖项进度、候选人数、中奖结果和历史记录都放在一屏内，现场操作更顺手。
        </p>

        <div class="hero-status-row">
          <div class="hero-status-chip">
            <span>当前奖项</span>
            <strong>{{ activePrize?.name || '请先配置奖项' }}</strong>
          </div>
          <div class="hero-status-chip">
            <span>待抽人数</span>
            <strong>{{ remainingParticipants.length }}</strong>
          </div>
          <div class="hero-status-chip">
            <span>开奖进度</span>
            <strong>{{ winnerCount }}/{{ totalPrizeSlots }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-actions">
        <el-button
          type="primary"
          size="large"
          :icon="MagicStick"
          :disabled="!canDraw"
          :loading="drawing"
          @click="drawWinner"
        >
          开始抽奖
        </el-button>
        <el-button size="large" :icon="RefreshRight" @click="resetCurrentPrize">
          重置当前奖项
        </el-button>
        <el-button size="large" :icon="Delete" @click="resetAllData">
          清空开奖记录
        </el-button>
      </div>
    </section>

    <el-row :gutter="14" class="dashboard-row">
      <el-col :xl="17" :lg="16" :md="24">
        <section class="stage-shell">
          <div class="stage-grid">
            <div class="metric-strip">
              <article class="metric-card">
                <span class="metric-label">参与人数</span>
                <strong class="metric-value">{{ participants.length }}</strong>
                <span class="metric-note">全场候选池</span>
              </article>
              <article class="metric-card">
                <span class="metric-label">已中奖</span>
                <strong class="metric-value">{{ winnerCount }}</strong>
                <span class="metric-note">默认不重复中奖</span>
              </article>
              <article class="metric-card">
                <span class="metric-label">待抽奖项</span>
                <strong class="metric-value">{{ pendingPrizeCount }}</strong>
                <span class="metric-note">按配置顺序开奖</span>
              </article>
              <article class="metric-card">
                <span class="metric-label">最近开奖</span>
                <strong class="metric-value small">{{
                  lastDrawTime || '--'
                }}</strong>
                <span class="metric-note">主持人可直接播报</span>
              </article>
            </div>

            <div class="main-stage-card">
              <div class="main-stage-head">
                <div>
                  <p class="main-stage-kicker">LIVE STAGE</p>
                  <h2>{{ activePrize?.name || '等待奖项配置' }}</h2>
                </div>
                <div class="prize-progress" v-if="activePrize">
                  <span
                    >{{ activePrize.remaining }}/{{ activePrize.count }}</span
                  >
                  <small>剩余名额</small>
                </div>
              </div>

              <div class="winner-screen" :class="{ rolling: drawing }">
                <div class="winner-screen-label">
                  {{ drawing ? '正在抽取幸运观众' : '本轮幸运得主' }}
                </div>
                <div class="winner-screen-name">{{ displayName }}</div>
                <div class="winner-screen-hint">
                  {{ stageHint }}
                </div>
              </div>

              <div class="stage-controls">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!canDraw"
                  :loading="drawing"
                  @click="drawWinner"
                >
                  抽取幸运儿
                </el-button>
                <el-button
                  size="large"
                  :disabled="drawing || !latestWinner"
                  @click="redrawLast"
                >
                  重抽本次
                </el-button>
              </div>

              <div class="queue-panel">
                <div class="queue-panel-header">
                  <span>奖项队列</span>
                  <span>{{ prizes.length }} 项</span>
                </div>
                <div class="queue-list">
                  <div
                    v-for="prize in prizes"
                    :key="prize.id"
                    class="queue-item"
                    :class="{
                      active: prize.id === activePrize?.id,
                      done: prize.remaining === 0
                    }"
                  >
                    <div>
                      <div class="queue-name">{{ prize.name }}</div>
                      <div class="queue-meta">
                        剩余 {{ prize.remaining }} / {{ prize.count }}
                      </div>
                    </div>
                    <el-tag
                      size="small"
                      :type="
                        prize.remaining === 0
                          ? 'success'
                          : prize.id === activePrize?.id
                            ? 'warning'
                            : 'info'
                      "
                      effect="light"
                    >
                      {{
                        prize.remaining === 0
                          ? '已完成'
                          : prize.id === activePrize?.id
                            ? '进行中'
                            : '待开奖'
                      }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <div class="history-card">
              <div class="panel-title-row">
                <div>
                  <h3>中奖记录</h3>
                  <p>最近 40 条现场记录</p>
                </div>
                <el-tag effect="plain">{{ winners.length }} 条</el-tag>
              </div>

              <el-empty v-if="!winners.length" description="还没有中奖记录" />
              <div v-else class="history-list">
                <div
                  v-for="item in visibleWinners"
                  :key="item.id"
                  class="history-item"
                >
                  <div class="history-main">
                    <strong>{{ item.name }}</strong>
                    <span>获得</span>
                    <em>{{ item.prizeName }}</em>
                  </div>
                  <time>{{ item.time }}</time>
                </div>
              </div>
            </div>
          </div>
        </section>
      </el-col>

      <el-col :xl="7" :lg="8" :md="24">
        <section class="sidebar-stack">
          <div class="control-card">
            <div class="panel-title-row">
              <div>
                <h3>参与名单</h3>
                <p>每行一个姓名，支持逗号和空格分隔</p>
              </div>
              <el-tag effect="plain">{{ participants.length }} 人</el-tag>
            </div>

            <el-input
              v-model="draftParticipants"
              type="textarea"
              :rows="7"
              resize="none"
              placeholder="例如：张晨、李冉、王璐"
            />

            <div class="action-row">
              <el-button type="primary" plain @click="applyParticipants">
                更新名单
              </el-button>
              <el-button @click="fillDemoParticipants">填充示例</el-button>
            </div>

            <div class="tag-board">
              <span
                v-for="name in participants"
                :key="name"
                class="name-pill"
                :class="{ winner: winnerNameSet.has(name) }"
              >
                {{ name }}
              </span>
            </div>
          </div>

          <div class="control-card">
            <div class="panel-title-row">
              <div>
                <h3>奖项配置</h3>
                <p>格式：奖项名称|人数</p>
              </div>
              <el-tag effect="plain">{{ prizes.length }} 项</el-tag>
            </div>

            <el-input
              v-model="draftPrizes"
              type="textarea"
              :rows="7"
              resize="none"
              placeholder="例如：特等奖|1"
            />

            <div class="action-row">
              <el-button type="primary" plain @click="applyPrizes">
                更新奖项
              </el-button>
              <el-button @click="fillDemoPrizes">填充示例</el-button>
            </div>

            <div class="compact-prize-list">
              <div
                v-for="prize in prizes"
                :key="prize.id"
                class="compact-prize-item"
              >
                <div class="compact-prize-copy">
                  <strong>{{ prize.name }}</strong>
                  <span>{{ prize.remaining }}/{{ prize.count }}</span>
                </div>
                <el-progress
                  :show-text="false"
                  :percentage="getPrizeProgress(prize)"
                  :stroke-width="8"
                  status="success"
                />
              </div>
            </div>
          </div>

          <div class="control-card quick-card">
            <div class="panel-title-row">
              <div>
                <h3>现场提示</h3>
                <p>给主持人和控台的快速说明</p>
              </div>
            </div>

            <ul class="quick-list">
              <li>默认同一位员工只会中奖一次。</li>
              <li>重抽本次会撤回上一条中奖记录并补回奖项名额。</li>
              <li>重置当前奖项会清空该奖项下的所有中奖结果。</li>
              <li>页面数据保存在浏览器本地，刷新后不会丢。</li>
            </ul>
          </div>
        </section>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, MagicStick, RefreshRight } from '@element-plus/icons-vue'

interface PrizeItem {
  id: string
  name: string
  count: number
  remaining: number
}

interface WinnerItem {
  id: string
  name: string
  prizeId: string
  prizeName: string
  time: string
}

interface LotteryState {
  participants: string[]
  prizes: PrizeItem[]
  winners: WinnerItem[]
}

const STORAGE_KEY = 'company-lottery-page-state-v2'

const demoParticipants = [
  '张晨',
  '李冉',
  '王璐',
  '赵航',
  '孙悦',
  '周宁',
  '徐朗',
  '陈曦',
  '高妍',
  '吴桐',
  '唐可',
  '许诺',
  '梁川',
  '沈薇',
  '何牧',
  '顾安'
]

const demoPrizeLines = [
  '特等奖|1',
  '一等奖|2',
  '二等奖|3',
  '三等奖|6',
  '阳光奖|4'
]

const participants = ref<string[]>([])
const prizes = ref<PrizeItem[]>([])
const winners = ref<WinnerItem[]>([])
const draftParticipants = ref('')
const draftPrizes = ref('')
const drawing = ref(false)
const rollingName = ref('')
const currentWinnerName = ref('')
const lastDrawTime = ref('')

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')

const parseNameList = (raw: string) =>
  Array.from(
    new Set(
      raw
        .split(/[\r\n,，、\t ]+/)
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  )

const buildPrize = (name: string, count: number, index: number): PrizeItem => ({
  id: `prize-${index + 1}-${name}`,
  name,
  count,
  remaining: count
})

const parsePrizeLines = (raw: string) => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .map((line, index) => {
      const [namePart, countPart] = line.split('|')
      const name = normalizeText(namePart || '')
      const count = Number.parseInt((countPart || '1').trim(), 10)
      if (!name || !Number.isFinite(count) || count <= 0) return null
      return buildPrize(name, count, index)
    })
    .filter((item): item is PrizeItem => !!item)
}

const formatNow = () =>
  new Date().toLocaleString('zh-CN', {
    hour12: false
  })

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const pickRandom = <T,>(list: T[]) =>
  list[Math.floor(Math.random() * list.length)] as T

const winnerNameSet = computed(
  () => new Set(winners.value.map((item) => item.name))
)

const remainingParticipants = computed(() =>
  participants.value.filter((name) => !winnerNameSet.value.has(name))
)

const activePrize = computed(
  () => prizes.value.find((item) => item.remaining > 0) || null
)

const canDraw = computed(
  () =>
    !drawing.value &&
    !!activePrize.value &&
    remainingParticipants.value.length > 0
)

const displayName = computed(() => {
  if (drawing.value) return rollingName.value || '抽奖中...'
  return currentWinnerName.value || '点击开始抽奖'
})

const stageHint = computed(() => {
  if (drawing.value) return '大屏滚动中，请准备宣布结果'
  if (!participants.value.length) return '请先录入参与名单'
  if (!prizes.value.length) return '请先配置奖项'
  if (!remainingParticipants.value.length)
    return '候选池已抽完，可重置或补充名单'
  if (!activePrize.value) return '全部奖项已开奖完成'
  return '准备就绪，点击按钮抽取本轮幸运儿'
})

const winnerCount = computed(() => winners.value.length)
const pendingPrizeCount = computed(
  () => prizes.value.filter((item) => item.remaining > 0).length
)
const totalPrizeSlots = computed(() =>
  prizes.value.reduce((sum, item) => sum + item.count, 0)
)
const latestWinner = computed(() => winners.value[0] || null)
const visibleWinners = computed(() => winners.value.slice(0, 40))

const syncDrafts = () => {
  draftParticipants.value = participants.value.join('\n')
  draftPrizes.value = prizes.value
    .map((item) => `${item.name}|${item.count}`)
    .join('\n')
}

const persistState = () => {
  const state: LotteryState = {
    participants: participants.value,
    prizes: prizes.value,
    winners: winners.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const fillDefaultData = () => {
  participants.value = [...demoParticipants]
  prizes.value = parsePrizeLines(demoPrizeLines.join('\n'))
  winners.value = []
  syncDrafts()
}

const hydrateState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      fillDefaultData()
      return
    }

    const parsed = JSON.parse(raw) as Partial<LotteryState>
    const nextParticipants = Array.isArray(parsed.participants)
      ? parsed.participants.filter(
          (item): item is string =>
            typeof item === 'string' && !!normalizeText(item)
        )
      : []
    const nextPrizes = Array.isArray(parsed.prizes)
      ? parsed.prizes.filter(
          (item): item is PrizeItem =>
            !!item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.count === 'number' &&
            typeof item.remaining === 'number'
        )
      : []
    const nextWinners = Array.isArray(parsed.winners)
      ? parsed.winners.filter(
          (item): item is WinnerItem =>
            !!item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.prizeId === 'string' &&
            typeof item.prizeName === 'string' &&
            typeof item.time === 'string'
        )
      : []

    participants.value = nextParticipants.length
      ? nextParticipants
      : [...demoParticipants]
    prizes.value = nextPrizes.length
      ? nextPrizes
      : parsePrizeLines(demoPrizeLines.join('\n'))
    winners.value = nextWinners
    syncDrafts()
  } catch {
    fillDefaultData()
  }
}

const applyParticipants = () => {
  const next = parseNameList(draftParticipants.value)
  if (!next.length) {
    ElMessage.warning('请至少保留一位参与人')
    return
  }

  const removedWinners = winners.value.filter(
    (item) => !next.includes(item.name)
  )
  if (removedWinners.length) {
    const returnedPrizeIds = new Set(removedWinners.map((item) => item.prizeId))
    prizes.value = prizes.value.map((item) =>
      returnedPrizeIds.has(item.id)
        ? { ...item, remaining: Math.min(item.count, item.remaining + 1) }
        : item
    )
    winners.value = winners.value.filter((item) => next.includes(item.name))
  }

  participants.value = next
  currentWinnerName.value = ''
  ElMessage.success('参与名单已更新')
}

const applyPrizes = () => {
  const next = parsePrizeLines(draftPrizes.value)
  if (!next.length) {
    ElMessage.warning('请至少配置一个奖项')
    return
  }

  const winnerMap = new Map<string, number>()
  for (const item of winners.value) {
    winnerMap.set(item.prizeName, (winnerMap.get(item.prizeName) || 0) + 1)
  }

  prizes.value = next.map((item) => {
    const used = winnerMap.get(item.name) || 0
    return {
      ...item,
      remaining: Math.max(0, item.count - used)
    }
  })
  winners.value = winners.value.filter((item) =>
    next.some((prize) => prize.name === item.prizeName)
  )
  currentWinnerName.value = ''
  ElMessage.success('奖项配置已更新')
}

const fillDemoParticipants = () => {
  draftParticipants.value = demoParticipants.join('\n')
}

const fillDemoPrizes = () => {
  draftPrizes.value = demoPrizeLines.join('\n')
}

const drawWinner = async () => {
  if (!activePrize.value) {
    ElMessage.warning('没有可抽取的奖项')
    return
  }
  if (!remainingParticipants.value.length) {
    ElMessage.warning('没有可参与抽奖的人员')
    return
  }

  drawing.value = true
  try {
    for (let index = 0; index < 20; index += 1) {
      rollingName.value = pickRandom(remainingParticipants.value)
      await sleep(75)
    }

    const selectedName = pickRandom(remainingParticipants.value)
    const prize = activePrize.value
    const drawTime = formatNow()

    currentWinnerName.value = selectedName
    rollingName.value = selectedName
    lastDrawTime.value = drawTime

    winners.value.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: selectedName,
      prizeId: prize.id,
      prizeName: prize.name,
      time: drawTime
    })

    prizes.value = prizes.value.map((item) =>
      item.id === prize.id
        ? { ...item, remaining: Math.max(0, item.remaining - 1) }
        : item
    )

    ElMessage.success(`${selectedName} 抽中了 ${prize.name}`)
  } finally {
    drawing.value = false
  }
}

const redrawLast = async () => {
  if (!latestWinner.value) return

  const last = latestWinner.value
  winners.value = winners.value.slice(1)
  prizes.value = prizes.value.map((item) =>
    item.id === last.prizeId
      ? { ...item, remaining: Math.min(item.count, item.remaining + 1) }
      : item
  )
  currentWinnerName.value = ''
  rollingName.value = ''
  await drawWinner()
}

const resetCurrentPrize = async () => {
  if (!activePrize.value && !winners.value.length) {
    ElMessage.info('当前没有需要重置的奖项')
    return
  }

  const targetPrize =
    activePrize.value ||
    prizes.value.find((item) => item.id === latestWinner.value?.prizeId)
  if (!targetPrize) return

  try {
    await ElMessageBox.confirm(
      `确认重置 ${targetPrize.name} 的中奖记录吗？该奖项的中奖人会回到候选池。`,
      '重置当前奖项',
      { type: 'warning' }
    )

    const removed = winners.value.filter(
      (item) => item.prizeId === targetPrize.id
    )
    winners.value = winners.value.filter(
      (item) => item.prizeId !== targetPrize.id
    )
    prizes.value = prizes.value.map((item) =>
      item.id === targetPrize.id ? { ...item, remaining: item.count } : item
    )
    currentWinnerName.value = ''
    rollingName.value = ''
    ElMessage.success(
      `已重置 ${targetPrize.name}，撤回 ${removed.length} 条记录`
    )
  } catch {
    // canceled
  }
}

const resetAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确认清空所有中奖记录并恢复全部奖项名额吗？参与名单和奖项配置会保留。',
      '清空开奖记录',
      { type: 'warning' }
    )

    winners.value = []
    prizes.value = prizes.value.map((item) => ({
      ...item,
      remaining: item.count
    }))
    currentWinnerName.value = ''
    rollingName.value = ''
    lastDrawTime.value = ''
    ElMessage.success('已清空所有中奖记录')
  } catch {
    // canceled
  }
}

const getPrizeProgress = (prize: PrizeItem) => {
  if (!prize.count) return 0
  return Math.round(((prize.count - prize.remaining) / prize.count) * 100)
}

hydrateState()

watch(
  [participants, prizes, winners],
  () => {
    persistState()
    syncDrafts()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.company-lottery-page {
  min-height: calc(100vh - 64px);
  padding: 22px 24px 34px;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(251, 146, 60, 0.22) 0%,
      transparent 26%
    ),
    radial-gradient(
      circle at 90% 6%,
      rgba(245, 158, 11, 0.16) 0%,
      transparent 24%
    ),
    linear-gradient(180deg, #fff8f1 0%, #fff 30%, #f8fafc 100%);
}

.hero-band {
  margin-bottom: 14px;
  padding: 24px 26px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  border-radius: 18px;
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.16) 0%,
      transparent 34%
    ),
    linear-gradient(135deg, #7c2d12 0%, #c2410c 48%, #ea580c 100%);
  color: #fff;
  box-shadow: 0 20px 46px rgba(194, 65, 12, 0.22);
}

.hero-copy {
  max-width: 820px;
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255, 237, 213, 0.92);
}

.hero-copy h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.hero-desc {
  margin: 12px 0 0;
  max-width: 740px;
  line-height: 1.72;
  color: rgba(255, 247, 237, 0.92);
}

.hero-status-row {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-status-chip {
  min-width: 140px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
}

.hero-status-chip span {
  display: block;
  font-size: 12px;
  color: rgba(255, 237, 213, 0.78);
}

.hero-status-chip strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard-row {
  margin-bottom: 14px;
}

.stage-shell,
.sidebar-stack {
  height: 100%;
}

.stage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.main-stage-card,
.history-card,
.control-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.metric-card {
  min-height: 120px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-label,
.metric-note {
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  font-size: 28px;
  line-height: 1.1;
  color: #0f172a;
}

.metric-value.small {
  font-size: 18px;
}

.main-stage-card {
  padding: 18px;
}

.main-stage-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.main-stage-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #f97316;
}

.main-stage-head h2 {
  margin: 0;
  font-size: 20px;
  color: #111827;
}

.prize-progress {
  min-width: 96px;
  padding: 10px 12px;
  text-align: right;
  border-radius: 12px;
  background: #fff7ed;
  border: 1px solid #fdba74;
}

.prize-progress span {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #9a3412;
}

.prize-progress small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #c2410c;
}

.winner-screen {
  margin-top: 18px;
  min-height: 300px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 14px;
  text-align: center;
  border-radius: 18px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 237, 213, 0.92) 100%
  );
  border: 1px solid #fdba74;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.winner-screen.rolling {
  animation: flash 0.28s ease-in-out infinite;
}

@keyframes flash {
  0%,
  100% {
    transform: scale(1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  50% {
    transform: scale(1.01);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      0 0 0 4px rgba(251, 146, 60, 0.14);
  }
}

.winner-screen-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #c2410c;
}

.winner-screen-name {
  font-size: 64px;
  line-height: 1;
  font-weight: 800;
  color: #7c2d12;
  word-break: break-word;
}

.winner-screen-hint {
  max-width: 440px;
  font-size: 14px;
  color: #78716c;
  line-height: 1.6;
}

.stage-controls {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.queue-panel {
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.queue-panel-header,
.panel-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.queue-panel-header {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.queue-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.queue-item {
  min-height: 74px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.queue-item.active {
  border-color: #fb923c;
  background: #fff7ed;
}

.queue-item.done {
  opacity: 0.76;
}

.queue-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.queue-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.history-card,
.control-card {
  padding: 18px;
}

.panel-title-row h3 {
  margin: 0;
  font-size: 16px;
  color: #111827;
}

.panel-title-row p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.history-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.history-main {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  color: #334155;
}

.history-main strong {
  color: #111827;
}

.history-main em {
  font-style: normal;
  color: #c2410c;
  font-weight: 700;
}

.history-item time {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.sidebar-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action-row {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-board {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.name-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 13px;
}

.name-pill.winner {
  background: #ecfdf5;
  border-color: #86efac;
  color: #166534;
}

.compact-prize-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compact-prize-item {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.compact-prize-copy {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.compact-prize-copy strong {
  color: #111827;
  font-size: 14px;
}

.compact-prize-copy span {
  font-size: 12px;
  color: #64748b;
}

.quick-card {
  background: linear-gradient(180deg, #fff 0%, #fffaf5 100%);
}

.quick-list {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.8;
}

@media (max-width: 1400px) {
  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .winner-screen-name {
    font-size: 52px;
  }
}

@media (max-width: 1200px) {
  .company-lottery-page {
    padding: 18px 14px 28px;
  }

  .queue-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-row :deep(.el-col) {
    margin-bottom: 10px;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: 26px;
  }

  .winner-screen {
    min-height: 220px;
  }

  .winner-screen-name {
    font-size: 38px;
  }

  .history-item {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .winner-screen.rolling {
    animation: none;
  }
}
</style>
