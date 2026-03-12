<template>
  <div class="game-center-page">
    <div class="hero-panel">
      <div class="hero-copy">
        <p class="hero-kicker">GAME CENTER</p>
        <h1>前端小游戏中心</h1>
        <p class="hero-text">
          这里接入了 3
          款纯前端小游戏，不依赖后端即可直接游玩。点卡片里的“开始游戏”会进入对应玩法，左侧菜单也已经同步加好了入口。
        </p>
        <div class="hero-actions">
          <el-button
            type="primary"
            size="large"
            @click="goToGame(featuredGame.id)"
          >
            {{ activeGame ? '继续当前游戏' : '先玩一局贪吃蛇' }}
          </el-button>
          <el-button size="large" plain @click="pickRandomGame">
            随机挑一款
          </el-button>
        </div>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">已接入</span>
          <strong>3 款小游戏</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">操作方式</span>
          <strong>键盘 + 点击</strong>
        </div>
        <div class="stat-card highlight">
          <span class="stat-label">当前状态</span>
          <strong>{{
            activeGame ? `正在玩 ${activeGame.title}` : '等待选择游戏'
          }}</strong>
        </div>
      </div>
    </div>

    <div class="game-grid">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        :class="[game.accent, { active: activeGame?.id === game.id }]"
      >
        <div class="game-card-top">
          <div class="game-icon">
            <el-icon><component :is="game.icon" /></el-icon>
          </div>
          <div>
            <p class="game-subtitle">{{ game.subtitle }}</p>
            <h2>{{ game.title }}</h2>
          </div>
        </div>

        <p class="game-summary">{{ game.summary }}</p>

        <div class="chip-row">
          <span v-for="tag in game.tags" :key="tag" class="chip">{{
            tag
          }}</span>
        </div>

        <div class="control-list">
          <span
            v-for="control in game.controls"
            :key="control"
            class="control-pill"
          >
            {{ control }}
          </span>
        </div>

        <div class="game-card-actions">
          <el-button
            type="primary"
            :plain="activeGame?.id !== game.id"
            @click="goToGame(game.id)"
          >
            {{ activeGame?.id === game.id ? '正在游玩' : '开始游戏' }}
          </el-button>
          <el-button text @click="goToGame(game.id)"> 打开页面 </el-button>
        </div>
      </div>
    </div>

    <div v-if="activeGame" class="playground-panel">
      <div class="playground-header">
        <div>
          <p class="playground-kicker">NOW PLAYING</p>
          <h2>{{ activeGame.title }}</h2>
          <p>{{ activeGame.summary }}</p>
        </div>
        <div class="playground-actions">
          <el-button plain @click="goToHall">返回大厅</el-button>
          <el-button type="primary" @click="pickRandomGame"
            >换一个游戏</el-button
          >
        </div>
      </div>

      <component :is="activeGame.component" :key="activeGame.id" />
    </div>

    <div v-else class="lobby-panel">
      <div class="lobby-copy">
        <p class="playground-kicker">LOBBY</p>
        <h2>先选一个游戏再开玩</h2>
        <p>
          推荐顺序：先试 `贪吃蛇` 热身，再玩 `2048`，最后用 `记忆翻牌`
          做个短时记忆挑战。
        </p>
      </div>
      <div class="lobby-actions">
        <el-button type="primary" @click="goToGame('snake')"
          >开始贪吃蛇</el-button
        >
        <el-button plain @click="goToGame('2048')">开始 2048</el-button>
        <el-button plain @click="goToGame('memory')">开始记忆翻牌</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Aim, Grid, MagicStick } from '@element-plus/icons-vue'
import Game2048 from './components/Game2048.vue'
import MemoryFlipGame from './components/MemoryFlipGame.vue'
import SnakeGame from './components/SnakeGame.vue'

type GameId = 'snake' | '2048' | 'memory'

interface GameDefinition {
  id: GameId
  title: string
  subtitle: string
  summary: string
  tags: string[]
  controls: string[]
  icon: Component
  component: Component
  accent: string
}

const route = useRoute()
const router = useRouter()

const defaultGame: GameDefinition = {
  id: 'snake',
  title: '贪吃蛇',
  subtitle: 'SNAKE',
  summary: '吃掉能量块不断变长，避免撞墙和咬到自己，节奏会越打越快。',
  tags: ['经典街机', '反应力', '单局上头'],
  controls: ['方向键 / WASD 控制方向', '空格暂停 / 继续'],
  icon: Aim,
  component: SnakeGame,
  accent: 'accent-snake'
}

const games: GameDefinition[] = [
  defaultGame,
  {
    id: '2048',
    title: '2048',
    subtitle: 'MERGE',
    summary: '滑动合并相同数字，尽量凑出更高分，目标是合成 2048。',
    tags: ['数字策略', '越玩越上头', '可反复挑战'],
    controls: ['方向键 / WASD 滑动', 'R 键或按钮重新开始'],
    icon: Grid,
    component: Game2048,
    accent: 'accent-merge'
  },
  {
    id: 'memory',
    title: '记忆翻牌',
    subtitle: 'MEMORY',
    summary: '两两翻开相同图案完成清盘，用更少步数和更短时间拿更好的成绩。',
    tags: ['短时记忆', '轻度休闲', '适合摸鱼'],
    controls: ['点击卡牌翻面', '重新开始后会重新洗牌'],
    icon: MagicStick,
    component: MemoryFlipGame,
    accent: 'accent-memory'
  }
]

const gameMap = games.reduce(
  (collection, game) => {
    collection[game.id] = game
    return collection
  },
  {} as Record<GameId, GameDefinition>
)

const activeGameId = computed(() => {
  return typeof route.params.gameId === 'string' ? route.params.gameId : ''
})

const activeGame = computed(() => {
  if (!activeGameId.value) return null
  return gameMap[activeGameId.value as GameId] ?? null
})

const featuredGame = computed(() => activeGame.value ?? defaultGame)

const goToGame = (gameId: GameId) => {
  router.push(`/games/${gameId}`)
}

const goToHall = () => {
  router.push('/games')
}

const pickRandomGame = () => {
  const candidates = games.filter((game) => game.id !== activeGame.value?.id)
  const nextGame = candidates[Math.floor(Math.random() * candidates.length)]
  goToGame((nextGame ?? defaultGame).id)
}

watch(
  activeGameId,
  (gameId) => {
    if (!gameId) return
    if (!gameMap[gameId as GameId]) {
      router.replace('/games')
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.game-center-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background:
    radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.16), transparent 28%),
    radial-gradient(
      circle at 100% 12%,
      rgba(249, 115, 22, 0.18),
      transparent 25%
    ),
    linear-gradient(180deg, #f8fafc 0%, #eef6f5 100%);
}

.hero-panel,
.playground-panel,
.lobby-panel {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 28px;
  margin-bottom: 18px;
}

.hero-kicker,
.playground-kicker,
.game-subtitle {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  font-weight: 700;
}

.hero-kicker,
.playground-kicker {
  color: #0f766e;
}

.hero-copy h1,
.playground-header h2,
.lobby-copy h2 {
  margin: 0;
  color: #0f172a;
}

.hero-copy h1 {
  font-size: 34px;
  line-height: 1.15;
}

.hero-text,
.playground-header p,
.lobby-copy p {
  margin: 14px 0 0;
  max-width: 760px;
  line-height: 1.75;
  color: #475569;
}

.hero-actions,
.playground-actions,
.lobby-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 104px;
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #0f172a;
}

.stat-card.highlight {
  background: linear-gradient(135deg, #14532d 0%, #0f766e 100%);
  color: #f8fafc;
}

.stat-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: inherit;
  opacity: 0.72;
}

.stat-card strong {
  margin-top: 8px;
  font-size: 22px;
  line-height: 1.35;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.game-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.game-card:hover,
.game-card.active {
  transform: translateY(-4px);
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.14);
}

.game-card.active {
  border-color: rgba(15, 118, 110, 0.5);
}

.game-card-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.game-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  font-size: 24px;
}

.accent-snake .game-icon {
  background: linear-gradient(135deg, #bbf7d0 0%, #34d399 100%);
  color: #065f46;
}

.accent-merge .game-icon {
  background: linear-gradient(135deg, #fed7aa 0%, #f59e0b 100%);
  color: #9a3412;
}

.accent-memory .game-icon {
  background: linear-gradient(135deg, #f5d0fe 0%, #c084fc 100%);
  color: #6b21a8;
}

.game-subtitle {
  color: #64748b;
}

.game-card h2 {
  margin: 0;
  color: #0f172a;
}

.game-summary {
  min-height: 66px;
  margin: 16px 0 14px;
  color: #475569;
  line-height: 1.7;
}

.chip-row,
.control-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip,
.control-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
}

.chip {
  background: #ecfeff;
  color: #0f766e;
}

.control-list {
  margin-top: 14px;
}

.control-pill {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.game-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.playground-panel {
  padding: 22px;
}

.playground-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.lobby-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 28px;
}

@media (max-width: 1280px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .game-center-page {
    padding: 18px 14px 28px;
  }

  .hero-panel,
  .lobby-panel,
  .playground-header {
    grid-template-columns: 1fr;
    display: block;
  }

  .hero-stats {
    margin-top: 16px;
  }

  .playground-actions,
  .lobby-actions {
    margin-top: 16px;
  }
}
</style>
