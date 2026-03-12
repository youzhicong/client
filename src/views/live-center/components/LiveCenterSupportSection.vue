<template>
  <div class="support-grid">
    <div class="goods-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">商品节奏</span>
          <h3>重点货盘</h3>
        </div>
      </div>
      <div class="goods-list">
        <div v-for="item in productItems" :key="item.name" class="goods-item">
          <div class="goods-top">
            <div>
              <h4>{{ item.name }}</h4>
              <p>{{ item.badge }} · {{ item.price }}</p>
            </div>
            <span class="goods-sold">{{ item.sold }}</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${item.progress}%` }"
            ></div>
          </div>
          <div class="goods-foot">
            <span>{{ item.inventory }}</span
            ><span>上架进度 {{ item.progress }}%</span>
          </div>
        </div>
      </div>
    </div>
    <div class="team-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">协同动作</span>
          <h3>主播与运营</h3>
        </div>
      </div>
      <div class="team-list">
        <div v-for="item in teamTasks" :key="item.name" class="team-item">
          <div class="team-top">
            <h4>{{ item.name }}</h4>
            <span class="status-chip small" :class="item.tone">{{
              item.state
            }}</span>
          </div>
          <p>{{ item.owner }}</p>
          <span class="team-deadline">{{ item.deadline }}</span>
        </div>
      </div>
    </div>
    <div class="alerts-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">风险提醒</span>
          <h3>场控预警</h3>
        </div>
      </div>
      <div class="alert-list">
        <div
          v-for="item in alerts"
          :key="item.title"
          class="alert-item"
          :class="item.tone"
        >
          <div class="alert-top">
            <h4>{{ item.title }}</h4>
            <span class="status-chip small" :class="item.tone">{{
              item.level
            }}</span>
          </div>
          <p>{{ item.detail }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AlertItem, ProductItem, TeamTask } from '../types'
defineProps<{
  alerts: AlertItem[]
  productItems: ProductItem[]
  teamTasks: TeamTask[]
}>()
</script>

<style scoped lang="scss">
.support-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.goods-card,
.team-card,
.alerts-card {
  padding: 18px;
}
.goods-list,
.team-list,
.alert-list {
  display: grid;
  gap: 12px;
}
.goods-item,
.team-item,
.alert-item {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
  padding: 16px;
}
.goods-top,
.team-top,
.alert-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.goods-top h4,
.team-top h4,
.alert-top h4 {
  margin: 0;
  font-size: 16px;
}
.goods-sold,
.team-deadline {
  color: var(--lc-muted);
  font-size: 12px;
  font-weight: 600;
}
.goods-top p,
.team-item p,
.alert-item p {
  margin: 8px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
  line-height: 1.6;
}
.progress-track {
  height: 10px;
  margin-top: 14px;
  border-radius: 999px;
  background: rgba(15, 157, 146, 0.08);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--lc-accent), var(--lc-secondary));
}
.goods-foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  color: var(--lc-muted);
  font-size: 12px;
}
.alert-item.high {
  border-color: rgba(239, 68, 68, 0.2);
}
.alert-item.medium {
  border-color: rgba(245, 158, 11, 0.2);
}
.alert-item.low {
  border-color: rgba(37, 165, 161, 0.2);
}
@media (max-width: 1480px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .goods-top,
  .team-top,
  .alert-top {
    flex-direction: column;
    align-items: flex-start;
  }
  .goods-foot {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
