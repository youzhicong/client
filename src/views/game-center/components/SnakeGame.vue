<template>
  <div class="snake-shell">
    <div class="panel summary-panel">
      <div class="score-strip">
        <div class="score-card">
          <span>当前分数</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="score-card">
          <span>历史最高</span>
          <strong>{{ bestScore }}</strong>
        </div>
        <div class="score-card">
          <span>蛇身长度</span>
          <strong>{{ snake.length }}</strong>
        </div>
        <div class="score-card">
          <span>状态</span>
          <strong>{{ statusText }}</strong>
        </div>
      </div>

      <div class="action-strip">
        <el-button type="primary" @click="startGame">重新开始</el-button>
        <el-button plain @click="togglePause">
          {{ status === 'paused' ? '继续' : '暂停' }}
        </el-button>
      </div>
    </div>

    <div class="content-grid">
      <div class="board-panel panel">
        <div class="board-caption">
          <div>
            <p class="caption-kicker">SNAKE BOARD</p>
            <h3>保持移动，别撞墙</h3>
          </div>
          <span class="speed-chip">速度 {{ speed }}ms / 格</span>
        </div>

        <div class="board" :style="boardStyle">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="cell"
            :class="cell.role"
          />
        </div>

        <p class="board-tip">
          吃到橙色能量块会加分并变长。支持键盘方向键 /
          WASD，也支持下面的方向按钮。
        </p>
      </div>

      <div class="side-panel">
        <div class="panel info-card">
          <p class="caption-kicker">HOW TO PLAY</p>
          <h3>玩法说明</h3>
          <p>
            贪吃蛇已在进入页面后自动开始。你需要持续吃掉食物来增长长度，同时避免撞到边界或自己的身体。
          </p>
          <div class="tips">
            <span>方向键 / WASD 控制方向</span>
            <span>空格暂停 / 继续</span>
            <span>重新开始会立即清零当前分数</span>
          </div>
        </div>

        <div class="panel controller-card">
          <p class="caption-kicker">D-PAD</p>
          <div class="dpad">
            <button
              type="button"
              class="pad-btn"
              @click="handleDirectionInput('up')"
            >
              ↑
            </button>
            <button
              type="button"
              class="pad-btn"
              @click="handleDirectionInput('left')"
            >
              ←
            </button>
            <button type="button" class="pad-btn center" @click="togglePause">
              {{ status === 'paused' ? '▶' : 'II' }}
            </button>
            <button
              type="button"
              class="pad-btn"
              @click="handleDirectionInput('right')"
            >
              →
            </button>
            <button
              type="button"
              class="pad-btn"
              @click="handleDirectionInput('down')"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Direction = 'up' | 'down' | 'left' | 'right'
type GameStatus = 'running' | 'paused' | 'over'

interface Position {
  x: number
  y: number
}

interface BoardCell {
  key: string
  role: 'empty' | 'snake' | 'head' | 'food'
}

const BOARD_SIZE = 18
const STORAGE_KEY = 'game-center-snake-best-score'

const directionOffset: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const oppositeDirection: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
}

const serializePosition = (position: Position) => `${position.x}-${position.y}`

const createInitialSnake = (): Position[] => [
  { x: 5, y: 8 },
  { x: 4, y: 8 },
  { x: 3, y: 8 }
]

const randomPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE)
})

const createFood = (segments: Position[]): Position => {
  const occupied = new Set(segments.map(serializePosition))
  let next = randomPosition()

  while (occupied.has(serializePosition(next))) {
    next = randomPosition()
  }

  return next
}

const snake = ref<Position[]>(createInitialSnake())
const food = ref<Position>(createFood(snake.value))
const score = ref(0)
const bestScore = ref(Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0)
const direction = ref<Direction>('right')
const queuedDirection = ref<Direction | null>(null)
const status = ref<GameStatus>('running')

let timer: number | null = null

const speed = computed(() => Math.max(70, 170 - score.value * 4))

const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`
}))

const statusText = computed(() => {
  if (status.value === 'paused') return '已暂停'
  if (status.value === 'over') return '已结束'
  return '进行中'
})

const cells = computed<BoardCell[]>(() => {
  const head = snake.value[0]
  const headKey = head ? serializePosition(head) : ''
  const snakeSet = new Set(snake.value.map(serializePosition))
  const foodKey = serializePosition(food.value)

  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
    const x = index % BOARD_SIZE
    const y = Math.floor(index / BOARD_SIZE)
    const key = `${x}-${y}`

    let role: BoardCell['role'] = 'empty'
    if (key === foodKey) role = 'food'
    if (snakeSet.has(key)) role = key === headKey ? 'head' : 'snake'

    return { key, role }
  })
})

const clearTimer = () => {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

const persistBestScore = () => {
  if (score.value <= bestScore.value) return
  bestScore.value = score.value
  localStorage.setItem(STORAGE_KEY, String(bestScore.value))
}

const scheduleNextTick = () => {
  clearTimer()
  if (status.value !== 'running') return

  timer = window.setTimeout(() => {
    tick()
    scheduleNextTick()
  }, speed.value)
}

const startGame = () => {
  clearTimer()
  snake.value = createInitialSnake()
  food.value = createFood(snake.value)
  score.value = 0
  direction.value = 'right'
  queuedDirection.value = null
  status.value = 'running'
  scheduleNextTick()
}

const endGame = () => {
  status.value = 'over'
  clearTimer()
  persistBestScore()
}

const isOutsideBoard = (position: Position) => {
  return (
    position.x < 0 ||
    position.x >= BOARD_SIZE ||
    position.y < 0 ||
    position.y >= BOARD_SIZE
  )
}

const tick = () => {
  const head = snake.value[0]
  if (!head) {
    endGame()
    return
  }

  if (queuedDirection.value) {
    const candidate = queuedDirection.value
    if (oppositeDirection[direction.value] !== candidate) {
      direction.value = candidate
    }
  }
  queuedDirection.value = null

  const offset = directionOffset[direction.value]
  const nextHead: Position = {
    x: head.x + offset.x,
    y: head.y + offset.y
  }

  if (isOutsideBoard(nextHead)) {
    endGame()
    return
  }

  const willEat = serializePosition(nextHead) === serializePosition(food.value)
  const collisionSegments = willEat ? snake.value : snake.value.slice(0, -1)
  const hitSelf = collisionSegments.some((segment) => {
    return segment.x === nextHead.x && segment.y === nextHead.y
  })

  if (hitSelf) {
    endGame()
    return
  }

  const nextSnake = [nextHead, ...snake.value]
  if (willEat) {
    snake.value = nextSnake
    food.value = createFood(nextSnake)
    score.value += 1
    persistBestScore()
    return
  }

  nextSnake.pop()
  snake.value = nextSnake
}

const handleDirectionInput = (nextDirection: Direction) => {
  if (status.value === 'over') {
    startGame()
  }

  if (
    snake.value.length > 1 &&
    oppositeDirection[direction.value] === nextDirection
  ) {
    return
  }

  if (status.value === 'paused') {
    status.value = 'running'
    scheduleNextTick()
  }

  queuedDirection.value = nextDirection
}

const togglePause = () => {
  if (status.value === 'over') {
    startGame()
    return
  }

  if (status.value === 'paused') {
    status.value = 'running'
    scheduleNextTick()
    return
  }

  status.value = 'paused'
  clearTimer()
}

const handleKeydown = (event: KeyboardEvent) => {
  const keyDirectionMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right'
  }

  const matchedDirection = keyDirectionMap[event.code]
  if (matchedDirection) {
    event.preventDefault()
    handleDirectionInput(matchedDirection)
    return
  }

  if (event.code === 'Space') {
    event.preventDefault()
    togglePause()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  startGame()
})

onBeforeUnmount(() => {
  clearTimer()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.snake-shell {
  display: grid;
  gap: 16px;
}

.panel {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.92),
    rgba(17, 24, 39, 0.98)
  );
  color: #e2e8f0;
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.2);
}

.summary-panel {
  padding: 18px;
}

.score-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.score-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(148, 163, 184, 0.12);
}

.score-card span {
  display: block;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.72);
}

.score-card strong {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  color: #f8fafc;
}

.action-strip {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.72fr);
  gap: 16px;
}

.board-panel,
.info-card,
.controller-card {
  padding: 20px;
}

.board-caption {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.caption-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #34d399;
}

.board-caption h3,
.info-card h3 {
  margin: 0;
}

.speed-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  color: #86efac;
  font-size: 12px;
}

.board {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.85), rgba(15, 23, 42, 0.95)),
    linear-gradient(135deg, rgba(74, 222, 128, 0.14), rgba(251, 146, 60, 0.14));
}

.cell {
  aspect-ratio: 1;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.cell.snake {
  background: linear-gradient(135deg, #10b981 0%, #22c55e 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.32);
}

.cell.head {
  background: linear-gradient(135deg, #bbf7d0 0%, #4ade80 100%);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.cell.food {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
}

.board-tip,
.info-card p {
  margin: 14px 0 0;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.84);
}

.side-panel {
  display: grid;
  gap: 16px;
}

.tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tips span {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}

.dpad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.dpad .pad-btn:first-child {
  grid-column: 2;
}

.dpad .pad-btn:nth-child(2) {
  grid-column: 1;
}

.dpad .pad-btn:nth-child(3) {
  grid-column: 2;
}

.dpad .pad-btn:nth-child(4) {
  grid-column: 3;
}

.dpad .pad-btn:last-child {
  grid-column: 2;
}

.pad-btn {
  min-height: 58px;
  border: 0;
  border-radius: 18px;
  background: rgba(148, 163, 184, 0.12);
  color: #f8fafc;
  font-size: 24px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.pad-btn:hover {
  transform: translateY(-2px);
  background: rgba(52, 211, 153, 0.2);
}

.pad-btn.center {
  font-size: 20px;
}

@media (max-width: 1080px) {
  .score-strip,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
