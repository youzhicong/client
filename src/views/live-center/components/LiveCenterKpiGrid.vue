<template>
  <div class="kpi-grid">
    <div
      v-for="item in kpiCards"
      :key="item.label"
      class="kpi-card card"
      :class="item.tone"
    >
      <div class="kpi-head">
        <span class="kpi-label">{{ item.label }}</span>
        <span class="kpi-badge">{{ item.badge }}</span>
      </div>
      <strong class="kpi-value">{{ item.value }}</strong>
      <div class="kpi-foot">
        <span class="kpi-delta" :class="item.deltaTone">{{ item.delta }}</span>
        <span class="kpi-note">{{ item.note }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { KpiCard } from '../types'

defineProps<{
  kpiCards: KpiCard[]
}>()
</script>

<style scoped lang="scss">
.kpi-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 15px 16px;
}

.kpi-head,
.kpi-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.kpi-label,
.kpi-note {
  font-size: 12px;
  color: var(--lc-muted);
}

.kpi-badge {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.kpi-value {
  display: block;
  margin: 12px 0;
  font-size: 28px;
  line-height: 1;
}

.kpi-delta {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.kpi-delta.up {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.kpi-delta.down {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.kpi-card.rose .kpi-badge {
  background: rgba(15, 157, 146, 0.12);
  color: #0e756d;
}

.kpi-card.amber .kpi-badge {
  background: rgba(47, 125, 225, 0.12);
  color: #1d4ed8;
}

.kpi-card.aqua .kpi-badge {
  background: rgba(239, 127, 56, 0.14);
  color: #b45309;
}

.kpi-card.violet .kpi-badge {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

@media (max-width: 1480px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-head,
  .kpi-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
