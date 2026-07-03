const fs = require('fs')
const path = require('path')

const target = path.join(
  __dirname,
  '../src/components/agent/BusinessClosureTrace.vue'
)

const content = `<template>
  <div v-if="steps.length" class="closure-trace">
    <div class="closure-trace-head">
      <div class="closure-trace-title">
        <span class="closure-trace-icon">📋</span>
        <strong>商务闭环</strong>
        <span v-if="isComplete" class="closure-trace-badge done">已完成</span>
        <span v-else-if="hasError" class="closure-trace-badge error">异常</span>
        <span v-else class="closure-trace-badge running">进行中</span>
      </div>
      <div v-if="closure" class="closure-trace-summary">
        <span>{{ closure.approvalCode }}</span>
        <span class="closure-trace-arrow">→</span>
        <span>{{ closure.contractCode }}</span>
        <span v-if="closure.amount">· ¥{{ closure.amount.toLocaleString('zh-CN') }}</span>
      </div>
    </div>

    <div class="closure-timeline">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="closure-timeline-item"
        :class="{
          done: step.status === 'done',
          error: step.status === 'error',
          last: index === steps.length - 1
        }"
      >
        <div class="closure-timeline-rail">
          <div class="closure-timeline-dot" :class="stepIconClass(step.key)">
            <el-icon v-if="step.status === 'error'"><CircleCloseFilled /></el-icon>
            <el-icon v-else-if="step.key === 'approval_pass'"><CircleCheckFilled /></el-icon>
            <el-icon v-else-if="isSealStep(step.key)"><Stamp /></el-icon>
            <el-icon v-else-if="step.key.startsWith('contract')"><Document /></el-icon>
            <el-icon v-else><Tickets /></el-icon>
          </div>
          <div v-if="index < steps.length - 1" class="closure-timeline-line" />
        </div>

        <div class="closure-timeline-body">
          <div class="closure-timeline-label">{{ step.label }}</div>
          <div class="closure-timeline-detail">{{ step.detail }}</div>
          <div v-if="sealPreview(step.key)" class="closure-timeline-seal">
            <img :src="sealPreview(step.key)!" :alt="step.label" />
            <span>{{ sealPartyLabel(step.key) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="closure && isComplete" class="closure-trace-footer">
      <div class="closure-seal-pair">
        <div class="closure-seal-mini">
          <img :src="closure.sealImages.partyA" alt="甲方章" />
          <small>{{ closure.partyA }}</small>
        </div>
        <div class="closure-seal-divider">⇄</div>
        <div class="closure-seal-mini">
          <img :src="closure.sealImages.partyB" alt="乙方章" />
          <small>{{ closure.partyB }}</small>
        </div>
      </div>
      <p class="closure-trace-effective">
        《{{ closure.contractTitle }}》已双章签署生效
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  Document,
  Stamp,
  Tickets
} from '@element-plus/icons-vue'
import type {
  BusinessClosureResult,
  BusinessClosureStep
} from '@/services/ai-automation/business-flow'

defineOptions({
  name: 'BusinessClosureTrace'
})

const props = defineProps<{
  steps: BusinessClosureStep[]
  closure?: BusinessClosureResult | null
}>()

const isSealStep = (key: string) => key === 'seal_a' || key === 'seal_b'

const stepIconClass = (key: string) => {
  if (key.startsWith('approval')) return 'icon-approval'
  if (key.startsWith('contract')) return 'icon-contract'
  if (isSealStep(key)) return key === 'seal_a' ? 'icon-seal-a' : 'icon-seal-b'
  return 'icon-default'
}

const sealPreview = (key: string) => {
  if (!props.closure) return null
  if (key === 'seal_a') return props.closure.sealImages.partyA
  if (key === 'seal_b') return props.closure.sealImages.partyB
  return null
}

const sealPartyLabel = (key: string) => {
  if (!props.closure) return ''
  return key === 'seal_a' ? props.closure.partyA : props.closure.partyB
}

const hasError = computed(() => props.steps.some((step) => step.status === 'error'))

const isComplete = computed(() => {
  if (props.closure?.contractStatus === 'completed') return true
  return props.steps.some((step) => step.key === 'seal_b' && step.status === 'done')
})
</script>

<style scoped lang="scss">
.closure-trace {
  border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border);
  background: linear-gradient(180deg, #f8fafc 0%, var(--app-surface) 100%);
  overflow: hidden;
}

.closure-trace-head {
  padding: 14px 16px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface);
}

.closure-trace-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  strong {
    font-size: 14px;
    color: var(--app-text-main);
  }
}

.closure-trace-icon {
  font-size: 16px;
}

.closure-trace-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;

  &.done {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }

  &.running {
    background: var(--app-accent-soft);
    color: var(--app-accent);
    border: 1px solid var(--app-accent-muted);
  }

  &.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
}

.closure-trace-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--app-text-sub);
  font-family: var(--app-font-mono);
}

.closure-trace-arrow {
  color: var(--app-text-faint);
}

.closure-timeline {
  padding: 16px 16px 8px;
}

.closure-timeline-item {
  display: flex;
  gap: 12px;
  min-height: 52px;

  &.last {
    min-height: auto;
  }
}

.closure-timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.closure-timeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-sub);
  font-size: 14px;

  &.icon-approval {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #2563eb;
  }

  &.icon-contract {
    border-color: #fde68a;
    background: #fffbeb;
    color: #d97706;
  }

  &.icon-seal-a {
    border-color: #fecaca;
    background: #fef2f2;
    color: #dc2626;
  }

  &.icon-seal-b {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #2563eb;
  }
}

.closure-timeline-line {
  flex: 1;
  width: 2px;
  min-height: 16px;
  margin: 4px 0;
  background: linear-gradient(180deg, var(--app-border) 0%, transparent 100%);
}

.closure-timeline-item.done .closure-timeline-line {
  background: linear-gradient(180deg, #86efac 0%, var(--app-border) 100%);
}

.closure-timeline-item.error .closure-timeline-dot {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.closure-timeline-body {
  flex: 1;
  padding-bottom: 14px;
}

.closure-timeline-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-main);
  line-height: 1.4;
}

.closure-timeline-detail {
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-text-sub);
  line-height: 1.5;
}

.closure-timeline-seal {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px dashed var(--app-border);
  background: #fff;

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.closure-trace-footer {
  padding: 12px 16px 16px;
  border-top: 1px dashed var(--app-border);
  background: #fff;
}

.closure-seal-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.closure-seal-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  small {
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.closure-seal-divider {
  font-size: 18px;
  color: var(--app-text-faint);
}

.closure-trace-effective {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: #059669;
  font-weight: 600;
}
</style>
`

fs.writeFileSync(target, content, 'utf8')
console.log('Wrote', target)
