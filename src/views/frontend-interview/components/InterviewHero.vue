<template>
  <div class="hero panel">
    <div class="hero-left">
      <p class="hero-kicker">FRONTEND INTERVIEW BANK</p>
      <h1>前端面试题库</h1>
      <p class="hero-desc">
        覆盖 Vue 与 React 两大方向，按专题整理高频题，支持关键词检索与快速复习。
      </p>
    </div>
    <div class="hero-right">
      <div class="stat-item">
        <span class="stat-label">总题量</span>
        <strong>{{ totalQuestions }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">Vue</span>
        <strong>{{ totalVueQuestions }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">React</span>
        <strong>{{ totalReactQuestions }}</strong>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  totalQuestions: number
  totalVueQuestions: number
  totalReactQuestions: number
}>()
</script>

<style lang="scss" scoped>
.hero {
  margin-bottom: 16px;
  padding: 26px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  background: linear-gradient(140deg, #0f172a 0%, #1e3a8a 55%, #0c4a6e 100%);
  color: #e2e8f0;
  box-shadow: 0 20px 46px rgba(15, 23, 42, 0.22);
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.9);
}

.hero-left h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: 0.01em;
}

.hero-desc {
  margin: 10px 0 0;
  max-width: 680px;
  color: rgba(226, 232, 240, 0.86);
  line-height: 1.7;
  font-size: 14px;
}

.hero-right {
  display: grid;
  grid-template-columns: repeat(3, minmax(88px, 1fr));
  gap: 10px;
  min-width: 310px;
}

.stat-item {
  border-radius: 14px;
  padding: 12px 10px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(15, 23, 42, 0.36);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.95);
}

.stat-item strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  color: #f8fafc;
}

@media (max-width: 1200px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-right {
    min-width: 0;
  }
}
</style>
