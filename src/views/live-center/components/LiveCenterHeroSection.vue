<template>
  <div class="hero card">
    <div class="hero-copy">
      <span class="hero-kicker">LIVE COMMERCE HUB</span>
      <h1 class="hero-title">直播模块</h1>
      <p class="hero-desc">
        把直播数据、用户观看、礼物互动、充值转化、商品节奏与运营协同统一到一个模块内管理。
      </p>

      <div class="hero-tags">
        <span v-for="tag in heroTags" :key="tag" class="hero-tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="hero-stats">
      <div v-for="item in heroMetrics" :key="item.label" class="hero-stat">
        <span class="hero-stat-label">{{ item.label }}</span>
        <strong class="hero-stat-value">{{ item.value }}</strong>
        <span class="hero-stat-foot">{{ item.foot }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { HeroMetric } from '../types'

defineProps<{
  heroTags: string[]
  heroMetrics: HeroMetric[]
}>()
</script>

<style scoped lang="scss">
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 18px;
  padding: 22px;
}

.hero-title {
  margin: 14px 0 10px;
  font-size: 32px;
  line-height: 1.08;
}

.hero-desc {
  margin: 0;
  max-width: 680px;
  color: var(--lc-muted);
  font-size: 14px;
  line-height: 1.7;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--lc-border);
  color: var(--lc-text);
  font-size: 12px;
  font-weight: 600;
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.hero-stat {
  padding: 16px 18px;
  border-radius: 16px;
  background: var(--lc-panel-strong);
  border: 1px solid var(--lc-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-stat-label {
  font-size: 12px;
  color: var(--lc-muted);
}

.hero-stat-value {
  font-size: 28px;
  line-height: 1;
}

.hero-stat-foot {
  color: var(--lc-secondary);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .hero-title {
    font-size: 28px;
  }
}
</style>
