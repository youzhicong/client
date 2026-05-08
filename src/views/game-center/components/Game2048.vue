<template>
  <div class="merge-shell">
    <div class="top-grid">
      <div class="merge-panel hero-panel">
        <div>
          <p class="panel-kicker">2048 MERGE</p>
          <h3>把数字一路合到更高</h3>
          <p>
            用方向键或下面的方向按钮滑动。每次操作后会随机生成一个新数字，无法移动时游戏结束。
          </p>
        </div>
        <div class="button-row">
          <el-button type="primary" @click="startGame">重新开始</el-button>
          <el-button plain @click="keepTrying">
            {{ hasWon ? '继续冲分' : '继续当前局' }}
          </el-button>
        </div>
      </div>

      <div class="merge-panel score-panel">
        <div class="score-card">
          <span>当前分数</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="score-card">
          <span>历史最高</span>
          <strong>{{ bestScore }}</strong>
        </div>
        <div class="score-card">
          <span>当前最大</span>
          <strong>{{ largestTile }}</strong>
        </div>
        <div class="score-card">
          <span>状态</span>
          <strong>{{ statusText }}</strong>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="merge-panel board-panel">
        <div class="merge-board">
          <div
            v-for="(row, rowIndex) in board"
            :key="`row-${rowIndex}`"
            class="row"
          >
            <div
              v-for="(cell, cellIndex) in row"
              :key="`cell-${rowIndex}-${cellIndex}`"
              class="tile"
              :class="tileClass(cell)"
            >
              <span v-if="cell">{{ cell }}</span>
            </div>
          </div>
        </div>

        <div class="mobile-controls">
          <button
            type="button"
            class="control-btn"
            aria-label="向上移动"
            @click="move('up')"
          >
            ↑
          </button>
          <button
            type="button"
            class="control-btn"
            aria-label="向左移动"
            @click="move('left')"
          >
            ←
          </button>
          <button
            type="button"
            class="control-btn center"
            aria-label="重新开始"
            @click="startGame"
          >
            R
          </button>
          <button
            type="button"
            class="control-btn"
            aria-label="向右移动"
            @click="move('right')"
          >
            →
          </button>
          <button
            type="button"
            class="control-btn"
            aria-label="向下移动"
            @click="move('down')"
          >
            ↓
          </button>
        </div>
      </div>

      <div class="merge-panel tips-panel">
        <p class="panel-kicker">PLAY TIPS</p>
        <h3>实用技巧</h3>
        <div class="tip-list">
          <div class="tip-item">
            <strong>固定角落</strong>
            <span>尽量把最大数字固定在同一个角，减少局面失控。</span>
          </div>
          <div class="tip-item">
            <strong>少做横跳</strong>
            <span>频繁左右来回会打乱数字梯度，后期容易卡死。</span>
          </div>
          <div class="tip-item">
            <strong>节奏优先</strong>
            <span>一旦合成 2048 还可以继续冲更高分，不用停。</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({
  name: 'Game2048Board'
})

type Direction = 'up' | 'down' | 'left' | 'right'
type GameStatus = 'running' | 'over'
type Board = number[][]

const SIZE = 4
const STORAGE_KEY = 'game-center-2048-best-score'

const createEmptyBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

const cloneBoard = (board: Board): Board => board.map((row) => [...row])

const boardsEqual = (left: Board, right: Board) => {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if ((left[row]?.[col] ?? 0) !== (right[row]?.[col] ?? 0)) {
        return false
      }
    }
  }

  return true
}

const addRandomTile = (board: Board): Board => {
  const nextBoard = cloneBoard(board)
  const emptyCells: Array<{ row: number; col: number }> = []

  nextBoard.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      if (!cell) {
        emptyCells.push({ row: rowIndex, col: cellIndex })
      }
    })
  })

  if (!emptyCells.length) return nextBoard

  const selected = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  if (!selected) return nextBoard
  const targetRow = nextBoard[selected.row]
  if (!targetRow) return nextBoard
  targetRow[selected.col] = Math.random() < 0.9 ? 2 : 4
  return nextBoard
}

const createInitialBoard = () =>
  addRandomTile(addRandomTile(createEmptyBoard()))

const compressLine = (line: number[]) => {
  const compacted = line.filter((cell) => cell !== 0)
  const nextLine: number[] = []
  let gain = 0

  for (let index = 0; index < compacted.length; index += 1) {
    const current = compacted[index]
    if (current === undefined) continue
    const next = compacted[index + 1]

    if (current === next) {
      const merged = current * 2
      nextLine.push(merged)
      gain += merged
      index += 1
      continue
    }

    nextLine.push(current)
  }

  while (nextLine.length < SIZE) {
    nextLine.push(0)
  }

  return { nextLine, gain }
}

const hasAvailableMoves = (board: Board) => {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = board[row]?.[col] ?? 0
      if (cell === 0) return true
      if (row + 1 < SIZE && (board[row + 1]?.[col] ?? 0) === cell) return true
      if (col + 1 < SIZE && (board[row]?.[col + 1] ?? 0) === cell) return true
    }
  }

  return false
}

const board = ref<Board>(createInitialBoard())
const score = ref(0)
const bestScore = ref(Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0)
const status = ref<GameStatus>('running')
const hasWon = ref(false)

const largestTile = computed(() => Math.max(...board.value.flat()))

const statusText = computed(() => {
  if (status.value === 'over') return '已结束'
  if (hasWon.value) return '已合成 2048'
  return '进行中'
})

const persistBestScore = () => {
  if (score.value <= bestScore.value) return
  bestScore.value = score.value
  localStorage.setItem(STORAGE_KEY, String(bestScore.value))
}

const startGame = () => {
  board.value = createInitialBoard()
  score.value = 0
  status.value = 'running'
  hasWon.value = false
}

const keepTrying = () => {
  if (status.value === 'over') {
    startGame()
  }
}

const moveBoard = (direction: Direction) => {
  const nextBoard = createEmptyBoard()
  let gain = 0

  if (direction === 'left' || direction === 'right') {
    board.value.forEach((row, rowIndex) => {
      const workingLine = direction === 'right' ? [...row].reverse() : [...row]
      const { nextLine, gain: lineGain } = compressLine(workingLine)
      const resolved = direction === 'right' ? nextLine.reverse() : nextLine

      nextBoard[rowIndex] = resolved
      gain += lineGain
    })
  } else {
    for (let col = 0; col < SIZE; col += 1) {
      const column = board.value.map((row) => row[col] ?? 0)
      const workingLine =
        direction === 'down' ? [...column].reverse() : [...column]
      const { nextLine, gain: lineGain } = compressLine(workingLine)
      const resolved = direction === 'down' ? nextLine.reverse() : nextLine

      resolved.forEach((value, rowIndex) => {
        const targetRow = nextBoard[rowIndex]
        if (!targetRow) return
        targetRow[col] = value
      })

      gain += lineGain
    }
  }

  return {
    nextBoard,
    gain,
    changed: !boardsEqual(board.value, nextBoard)
  }
}

const move = (direction: Direction) => {
  if (status.value === 'over') return

  const { nextBoard, gain, changed } = moveBoard(direction)
  if (!changed) return

  score.value += gain
  persistBestScore()

  const withRandomTile = addRandomTile(nextBoard)
  board.value = withRandomTile

  if (largestTile.value >= 2048) {
    hasWon.value = true
  }

  if (!hasAvailableMoves(board.value)) {
    status.value = 'over'
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const directionMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right'
  }

  const matchedDirection = directionMap[event.code]
  if (matchedDirection) {
    event.preventDefault()
    move(matchedDirection)
    return
  }

  if (event.code === 'KeyR') {
    event.preventDefault()
    startGame()
  }
}

const tileClass = (value: number) => {
  if (!value) return 'tile-empty'
  if (value >= 4096) return 'tile-super'
  return `tile-${value}`
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.merge-shell {
  display: grid;
  gap: 16px;
}

.top-grid,
.content-grid {
  display: grid;
  gap: 16px;
}

.top-grid {
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.9fr);
}

.content-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
}

.merge-panel {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #fffaf2 0%, #fff 100%);
  box-shadow: 0 24px 54px rgba(120, 53, 15, 0.08);
}

.hero-panel,
.board-panel,
.tips-panel {
  padding: 22px;
}

.panel-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #b45309;
  font-weight: 700;
}

.hero-panel h3,
.tips-panel h3 {
  margin: 0;
  color: #7c2d12;
}

.hero-panel p {
  margin: 14px 0 0;
  color: #78716c;
  line-height: 1.75;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.score-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.score-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fffbeb 0%, #ffedd5 100%);
}

.score-card span {
  display: block;
  font-size: 12px;
  color: #9a3412;
}

.score-card strong {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  color: #7c2d12;
}

.merge-board {
  padding: 14px;
  border-radius: 24px;
  background: linear-gradient(180deg, #bb7a35 0%, #8d5c2a 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.row + .row {
  margin-top: 12px;
}

.tile {
  aspect-ratio: 1;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: clamp(24px, 2vw, 34px);
  color: #4b2e14;
  background: rgba(255, 255, 255, 0.32);
  transition: transform 0.18s ease;
}

.tile-empty {
  background: rgba(255, 255, 255, 0.16);
}

.tile-2 {
  background: #fef3c7;
}

.tile-4 {
  background: #fde68a;
}

.tile-8 {
  background: #fdba74;
  color: #78350f;
}

.tile-16 {
  background: #fb923c;
  color: #fff7ed;
}

.tile-32 {
  background: #f97316;
  color: #fff7ed;
}

.tile-64 {
  background: #ea580c;
  color: #fff7ed;
}

.tile-128 {
  background: #facc15;
}

.tile-256 {
  background: #eab308;
}

.tile-512 {
  background: #ca8a04;
  color: #fff7ed;
}

.tile-1024 {
  background: #a16207;
  color: #fff7ed;
}

.tile-2048,
.tile-super {
  background: linear-gradient(135deg, #fef08a 0%, #f59e0b 100%);
  color: #78350f;
}

.mobile-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 76px));
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.mobile-controls .control-btn:first-child {
  grid-column: 2;
}

.mobile-controls .control-btn:nth-child(2) {
  grid-column: 1;
}

.mobile-controls .control-btn:nth-child(3) {
  grid-column: 2;
}

.mobile-controls .control-btn:nth-child(4) {
  grid-column: 3;
}

.mobile-controls .control-btn:last-child {
  grid-column: 2;
}

.control-btn {
  min-height: 56px;
  border: 0;
  border-radius: 18px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(120, 53, 15, 0.08);
}

.control-btn.center {
  font-size: 18px;
  font-weight: 700;
}

.tip-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.tip-item {
  padding: 16px;
  border-radius: 18px;
  background: #fffaf2;
  border: 1px solid #ffedd5;
}

.tip-item strong {
  display: block;
  color: #9a3412;
}

.tip-item span {
  display: block;
  margin-top: 8px;
  color: #78716c;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .top-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
