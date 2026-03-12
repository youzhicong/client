<template>
  <div class="ops-grid">
    <div class="schedule-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">今日排期</span>
          <h3>直播节点</h3>
        </div>
      </div>
      <div class="schedule-list">
        <div
          v-for="item in scheduleItems"
          :key="`${item.time}-${item.title}`"
          class="schedule-item"
        >
          <div class="timeline-dot" :class="item.tone"></div>
          <div class="schedule-time">{{ item.time }}</div>
          <div class="schedule-body">
            <div class="schedule-top">
              <h4>{{ item.title }}</h4>
              <span class="mini-tag">{{ item.phase }}</span>
            </div>
            <p>{{ item.owner }}</p>
          </div>
          <span class="status-chip small" :class="item.tone">{{
            item.status
          }}</span>
        </div>
      </div>
    </div>
    <div class="script-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">直播内容</span>
          <h3>脚本编排</h3>
        </div>
      </div>
      <div class="script-list">
        <div
          v-for="item in scriptBlocks"
          :key="item.stage"
          class="script-item"
          :class="item.tone"
        >
          <div class="script-top">
            <h4>{{ item.stage }}</h4>
            <span>{{ item.duration }}</span>
          </div>
          <p class="script-focus">{{ item.focus }}</p>
          <p class="script-action">{{ item.action }}</p>
        </div>
      </div>
    </div>
    <div class="conversion-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">内容转化</span>
          <h3>成交效率排行</h3>
        </div>
      </div>
      <div class="conversion-rank">
        <div
          v-for="item in conversionRanking"
          :key="item.label"
          class="conversion-row"
        >
          <span class="conversion-label">{{ item.label }}</span
          ><strong>{{ item.value }}</strong
          ><span class="conversion-note">{{ item.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ConversionRow, ScheduleItem, ScriptBlock } from '../types'
defineProps<{
  conversionRanking: ConversionRow[]
  scheduleItems: ScheduleItem[]
  scriptBlocks: ScriptBlock[]
}>()
</script>

<style scoped lang="scss">
.ops-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.schedule-card,
.script-card,
.conversion-card {
  padding: 18px;
}
.schedule-list,
.script-list,
.conversion-rank {
  display: grid;
  gap: 10px;
}
.schedule-item {
  display: grid;
  grid-template-columns: 16px 58px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: flex-start;
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 8px;
}
.timeline-dot.live {
  background: rgba(15, 157, 146, 0.9);
}
.timeline-dot.next {
  background: rgba(47, 125, 225, 0.9);
}
.timeline-dot.done {
  background: rgba(34, 197, 94, 0.9);
}
.schedule-time {
  color: var(--lc-secondary);
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;
}
.schedule-body,
.script-item,
.conversion-row {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
}
.schedule-body {
  padding: 14px;
}
.schedule-top,
.script-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.schedule-top h4,
.script-top h4 {
  margin: 0;
  font-size: 16px;
}
.schedule-body p,
.script-focus,
.script-action {
  margin: 8px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
  line-height: 1.6;
}
.script-item {
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}
.script-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
}
.script-item.rose::before {
  background: var(--lc-accent);
}
.script-item.amber::before {
  background: var(--lc-cool);
}
.script-item.aqua::before {
  background: var(--lc-secondary);
}
.script-item.violet::before {
  background: #22c55e;
}
.script-item.navy::before {
  background: #2f6dff;
}
.script-top span {
  color: var(--lc-muted);
  font-size: 12px;
  font-weight: 700;
}
.script-focus {
  color: var(--lc-text);
  font-weight: 600;
}
.conversion-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}
.conversion-label {
  font-size: 13px;
  font-weight: 600;
}
.conversion-row strong {
  font-size: 15px;
}
.conversion-note {
  color: var(--lc-muted);
  font-size: 11px;
}
@media (max-width: 1480px) {
  .ops-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .schedule-top,
  .script-top {
    flex-direction: column;
    align-items: flex-start;
  }
  .schedule-item {
    grid-template-columns: 16px 1fr;
  }
  .schedule-time,
  .schedule-body,
  .schedule-item .status-chip {
    grid-column: 2;
  }
  .conversion-row {
    grid-template-columns: 1fr;
  }
}
</style>
