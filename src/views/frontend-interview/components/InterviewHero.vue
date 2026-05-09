<template>
  <section class="hero">
    <div class="hero-copy">
      <p class="hero-kicker">FRONTEND INTERVIEW PREP</p>
      <h1>前端面试模块</h1>
      <p class="hero-desc">
        按通用基础、手写题、Vue、React
        四条主线整理高频题，支持搜索、随机抽题和只看题目模式，
        平时复习和面试前突击都很顺手。
      </p>
    </div>

    <div class="hero-stats">
      <div class="stat-card">
        <span>总题数</span>
        <strong>{{ totalQuestions }}</strong>
      </div>
      <div class="stat-card">
        <span>通用基础</span>
        <strong>{{ totalFoundationQuestions }}</strong>
      </div>
      <div class="stat-card">
        <span>手写题</span>
        <strong>{{ totalHandwritingQuestions }}</strong>
      </div>
      <div class="stat-card">
        <span>Vue</span>
        <strong>{{ totalVueQuestions }}</strong>
      </div>
      <div class="stat-card">
        <span>React</span>
        <strong>{{ totalReactQuestions }}</strong>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  totalQuestions: number
  totalFoundationQuestions: number
  totalHandwritingQuestions: number
  totalVueQuestions: number
  totalReactQuestions: number
}>()
</script>

<style lang="scss" scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
  gap: 18px;
  margin-bottom: 16px;
  padding: 24px;
  border-radius: 18px;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.28),
      transparent 36%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(16, 185, 129, 0.2),
      transparent 32%
    ),
    linear-gradient(140deg, #0f172a 0%, #1d4ed8 52%, #0f766e 100%);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.2);
  color: #e2e8f0;
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(191, 219, 254, 0.9);
}

.hero-copy h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  color: #f8fafc;
}

.hero-desc {
  margin: 12px 0 0;
  max-width: 720px;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(226, 232, 240, 0.88);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px 14px;
  border: 1px solid rgba(226, 232, 240, 0.18);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(8px);
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: rgba(191, 219, 254, 0.9);
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
  color: #fff;
}

@media (max-width: 1100px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 20px;
  }

  .hero-copy h1 {
    font-size: 26px;
  }
}
</style>
