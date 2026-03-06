<template>
  <div class="memory-shell">
    <div class="memory-header">
      <section class="memory-panel intro-panel">
        <p class="panel-kicker">MEMORY MATCH</p>
        <h3>翻开成对卡牌</h3>
        <p>
          这是一局 16
          张卡牌的记忆挑战。连续翻出相同图案即可配对成功，尽量用更少步数和更短时间完成。
        </p>
        <div class="actions">
          <el-button type="primary" @click="startGame">重新开始</el-button>
        </div>
      </section>

      <section class="memory-panel stat-panel">
        <div class="stat-card">
          <span>已用步数</span>
          <strong>{{ moves }}</strong>
        </div>
        <div class="stat-card">
          <span>已配对</span>
          <strong>{{ matchedPairs }} / {{ totalPairs }}</strong>
        </div>
        <div class="stat-card">
          <span>耗时</span>
          <strong>{{ elapsedLabel }}</strong>
        </div>
        <div class="stat-card">
          <span>最佳步数</span>
          <strong>{{ bestMoves || '--' }}</strong>
        </div>
      </section>
    </div>

    <div class="memory-content">
      <section class="memory-panel board-panel">
        <div class="card-grid">
          <button
            v-for="card in cards"
            :key="card.id"
            type="button"
            class="memory-card"
            :class="{
              flipped: card.flipped || card.matched,
              matched: card.matched
            }"
            :disabled="
              locked || card.flipped || card.matched || status === 'won'
            "
            @click="flipCard(card.id)"
          >
            <span class="card-face card-front">?</span>
            <span class="card-face card-back">{{ card.symbol }}</span>
          </button>
        </div>
      </section>

      <section class="memory-panel aside-panel">
        <div class="aside-block">
          <p class="panel-kicker">STATUS</p>
          <h3>{{ statusText }}</h3>
          <p>
            {{
              status === 'won'
                ? `本局用了 ${moves} 步，耗时 ${elapsedLabel}。`
                : '先记住位置，再快速完成配对。'
            }}
          </p>
        </div>

        <div class="aside-block">
          <p class="panel-kicker">BEST</p>
          <div class="best-grid">
            <div>
              <span>最佳步数</span>
              <strong>{{ bestMoves || '--' }}</strong>
            </div>
            <div>
              <span>最佳时间</span>
              <strong>{{ bestTimeLabel }}</strong>
            </div>
          </div>
        </div>

        <div class="aside-block">
          <p class="panel-kicker">RULE</p>
          <div class="tag-list">
            <span>一次翻两张</span>
            <span>相同图案即锁定</span>
            <span>不相同会自动翻回</span>
            <span>刷新后重新洗牌</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type GameStatus = 'running' | 'won'

interface MemoryCard {
  id: string
  symbol: string
  matched: boolean
  flipped: boolean
}

interface BestRecord {
  moves: number
  time: number
}

const STORAGE_KEY = 'game-center-memory-best'

const symbols = ['🚀', '🎧', '🧠', '🍉', '🎯', '🎮', '🧩', '⚽']

const shuffle = <T,>(items: T[]) => {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    const target = next[swapIndex]
    if (current === undefined || target === undefined) continue
    next[index] = target
    next[swapIndex] = current
  }
  return next
}

const createDeck = (): MemoryCard[] => {
  const source = [...symbols, ...symbols]
  return shuffle(source).map((symbol, index) => ({
    id: `${symbol}-${index}`,
    symbol,
    matched: false,
    flipped: false
  }))
}

const parseBestRecord = (): BestRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { moves: 0, time: 0 }

    const parsed = JSON.parse(raw) as Partial<BestRecord>
    return {
      moves: typeof parsed.moves === 'number' ? parsed.moves : 0,
      time: typeof parsed.time === 'number' ? parsed.time : 0
    }
  } catch {
    return { moves: 0, time: 0 }
  }
}

const formatSeconds = (seconds: number) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

const initialBestRecord = parseBestRecord()

const cards = ref<MemoryCard[]>([])
const moves = ref(0)
const elapsedSeconds = ref(0)
const locked = ref(false)
const status = ref<GameStatus>('running')
const firstSelectedId = ref<string | null>(null)
const bestMoves = ref(initialBestRecord.moves)
const bestTime = ref(initialBestRecord.time)

let hideTimer: number | null = null
let clockTimer: number | null = null

const totalPairs = symbols.length

const matchedPairs = computed(
  () => cards.value.filter((card) => card.matched).length / 2
)

const elapsedLabel = computed(() => formatSeconds(elapsedSeconds.value))

const bestTimeLabel = computed(() =>
  bestTime.value ? formatSeconds(bestTime.value) : '--'
)

const statusText = computed(() => {
  if (status.value === 'won') return '全部配对完成'
  return '记住位置并继续翻牌'
})

const clearTimers = () => {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }

  if (clockTimer !== null) {
    window.clearInterval(clockTimer)
    clockTimer = null
  }
}

const startClock = () => {
  if (clockTimer !== null) return
  clockTimer = window.setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const persistBestRecord = () => {
  const nextBestMoves =
    !bestMoves.value || moves.value < bestMoves.value
      ? moves.value
      : bestMoves.value
  const nextBestTime =
    !bestTime.value || elapsedSeconds.value < bestTime.value
      ? elapsedSeconds.value
      : bestTime.value

  bestMoves.value = nextBestMoves
  bestTime.value = nextBestTime
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      moves: nextBestMoves,
      time: nextBestTime
    })
  )
}

const startGame = () => {
  clearTimers()
  cards.value = createDeck()
  moves.value = 0
  elapsedSeconds.value = 0
  locked.value = false
  status.value = 'running'
  firstSelectedId.value = null
  startClock()
}

const finishGame = () => {
  status.value = 'won'
  clearTimers()
  persistBestRecord()
}

const flipCard = (cardId: string) => {
  if (locked.value || status.value === 'won') return

  const currentCard = cards.value.find((card) => card.id === cardId)
  if (!currentCard || currentCard.flipped || currentCard.matched) return

  currentCard.flipped = true

  if (!firstSelectedId.value) {
    firstSelectedId.value = cardId
    return
  }

  const previousCard = cards.value.find(
    (card) => card.id === firstSelectedId.value
  )
  if (!previousCard) {
    firstSelectedId.value = cardId
    return
  }

  moves.value += 1

  if (previousCard.symbol === currentCard.symbol) {
    previousCard.matched = true
    currentCard.matched = true
    firstSelectedId.value = null

    if (matchedPairs.value === totalPairs) {
      finishGame()
    }
    return
  }

  locked.value = true
  const firstId = firstSelectedId.value
  firstSelectedId.value = null

  hideTimer = window.setTimeout(() => {
    const first = cards.value.find((card) => card.id === firstId)
    const second = cards.value.find((card) => card.id === cardId)

    if (first && !first.matched) {
      first.flipped = false
    }
    if (second && !second.matched) {
      second.flipped = false
    }

    locked.value = false
  }, 650)
}

onMounted(() => {
  startGame()
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style lang="scss" scoped>
.memory-shell {
  display: grid;
  gap: 16px;
}

.memory-header,
.memory-content {
  display: grid;
  gap: 16px;
}

.memory-header {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.88fr);
}

.memory-content {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.82fr);
}

.memory-panel {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #fdf4ff 0%, #fff 100%);
  box-shadow: 0 24px 54px rgba(107, 33, 168, 0.08);
}

.intro-panel,
.board-panel,
.aside-panel {
  padding: 22px;
}

.panel-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: #7e22ce;
}

.intro-panel h3,
.aside-block h3 {
  margin: 0;
  color: #581c87;
}

.intro-panel p,
.aside-block p {
  margin: 14px 0 0;
  color: #6b7280;
  line-height: 1.75;
}

.actions {
  margin-top: 18px;
}

.stat-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.stat-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #faf5ff 0%, #f5d0fe 100%);
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #7e22ce;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #581c87;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.memory-card {
  position: relative;
  aspect-ratio: 1 / 1.12;
  border: 0;
  border-radius: 20px;
  background: transparent;
  transform-style: preserve-3d;
  cursor: pointer;
  perspective: 1000px;
}

.memory-card:disabled {
  cursor: default;
}

.card-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 20px;
  backface-visibility: hidden;
  transition:
    transform 0.45s ease,
    box-shadow 0.45s ease,
    background 0.45s ease;
  box-shadow: 0 16px 36px rgba(107, 33, 168, 0.12);
}

.card-front {
  background: linear-gradient(135deg, #7e22ce 0%, #c084fc 100%);
  color: #faf5ff;
  font-size: 36px;
  font-weight: 800;
}

.card-back {
  background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
  color: #581c87;
  font-size: 38px;
  transform: rotateY(180deg);
}

.memory-card.flipped .card-front,
.memory-card.matched .card-front {
  transform: rotateY(180deg);
}

.memory-card.flipped .card-back,
.memory-card.matched .card-back {
  transform: rotateY(360deg);
}

.memory-card.matched .card-back {
  background: linear-gradient(135deg, #d8b4fe 0%, #f0abfc 100%);
}

.aside-panel {
  display: grid;
  gap: 14px;
}

.aside-block {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #f3e8ff;
}

.best-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.best-grid span {
  display: block;
  font-size: 12px;
  color: #7e22ce;
}

.best-grid strong {
  display: block;
  margin-top: 8px;
  color: #581c87;
  font-size: 22px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-list span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #faf5ff;
  color: #7e22ce;
  font-size: 12px;
}

@media (max-width: 1180px) {
  .memory-header,
  .memory-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
