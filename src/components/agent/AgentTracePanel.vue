<template>
  <div v-if="visibleSteps.length" class="agent-trace">
    <div class="agent-trace-head">
      <strong>{{ title }}</strong>
      <span>{{ visibleSteps.length }} 步</span>
    </div>
    <div class="agent-trace-list">
      <template v-if="groupedSteps">
        <section
          v-for="group in groupedSteps"
          :key="group.agentId"
          class="agent-trace-group"
        >
          <div class="agent-trace-group-head">
            <span class="agent-trace-group-name">{{ group.agentName }}</span>
            <span class="agent-trace-group-count"
              >{{ group.steps.length }} 步</span
            >
          </div>
          <div
            v-for="step in group.steps"
            :key="step.id"
            class="agent-step"
            :class="`agent-step--${step.type}`"
          >
            <div class="agent-step-meta">
              <span class="agent-step-type">{{
                stepTypeLabel(step.type)
              }}</span>
              <span class="agent-step-time">{{
                formatTime(step.timestamp)
              }}</span>
            </div>
            <div v-if="step.toolName" class="agent-step-tool">
              {{ step.toolName }}
            </div>
            <pre v-if="shouldShowBody(step)" class="agent-step-body">{{
              step.content
            }}</pre>
          </div>
        </section>
      </template>
      <template v-else>
        <div
          v-for="step in visibleSteps"
          :key="step.id"
          class="agent-step"
          :class="`agent-step--${step.type}`"
        >
          <div class="agent-step-meta">
            <span class="agent-step-type">{{ stepTypeLabel(step.type) }}</span>
            <span v-if="step.agentName" class="agent-step-agent">{{
              step.agentName
            }}</span>
            <span class="agent-step-time">{{
              formatTime(step.timestamp)
            }}</span>
          </div>
          <div v-if="step.toolName" class="agent-step-tool">
            {{ step.toolName }}
          </div>
          <pre v-if="shouldShowBody(step)" class="agent-step-body">{{
            step.content
          }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgentStep, AgentStepType } from '@/services/ai-agent'

defineOptions({
  name: 'AgentTracePanel'
})

const props = withDefaults(
  defineProps<{
    steps: AgentStep[]
    title?: string
    excludeAgentIds?: string[]
    groupByAgent?: boolean
  }>(),
  {
    title: 'Agent Trace',
    excludeAgentIds: () => [],
    groupByAgent: false
  }
)

const visibleSteps = computed(() => {
  const ids = props.excludeAgentIds
  if (!ids.length) return props.steps
  return props.steps.filter(
    (step) => !step.agentId || !ids.includes(step.agentId)
  )
})

const groupedSteps = computed(() => {
  if (!props.groupByAgent) return null
  const groups: { agentId: string; agentName: string; steps: AgentStep[] }[] =
    []
  for (const step of visibleSteps.value) {
    const agentId = step.agentId || 'unknown'
    const agentName = step.agentName || agentId
    const last = groups[groups.length - 1]
    if (last && last.agentId === agentId) {
      last.steps.push(step)
    } else {
      groups.push({ agentId, agentName, steps: [step] })
    }
  }
  return groups
})

const stepTypeLabel = (type: AgentStepType) => {
  const map: Record<AgentStepType, string> = {
    agent_start: '启动',
    agent_end: '完成',
    thought: '思考',
    tool_call: '工具',
    tool_result: '结果',
    answer: '回答',
    error: '错误'
  }
  return map[type] || type
}

const shouldShowBody = (step: AgentStep) => {
  if (step.type === 'agent_start' || step.type === 'agent_end') return false
  if (step.type === 'tool_call') return Boolean(step.toolArgs)
  return Boolean(step.content)
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
</script>

<style scoped lang="scss">
.agent-trace {
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  overflow: hidden;
}

.agent-trace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  strong {
    font-size: 13px;
    color: var(--app-text-main);
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.agent-trace-list {
  max-height: 360px;
  overflow: auto;
  padding: 8px;
  display: grid;
  gap: 8px;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-border-strong);
    border-radius: 999px;
  }
}

.agent-trace-group {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
}

.agent-trace-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: var(--app-surface-muted);
  border-bottom: 1px solid var(--app-border);
}

.agent-trace-group-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-main);
}

.agent-trace-group-count {
  font-size: 10px;
  color: var(--app-text-faint);
}

.agent-trace-group .agent-step {
  border: none;
  border-radius: 0;
  border-bottom: 1px solid var(--app-border);
  background: transparent;

  &:last-child {
    border-bottom: none;
  }
}

.agent-step {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.agent-step--tool_call {
  border-color: var(--app-accent-muted);
  background: var(--app-accent-soft);
}

.agent-step--tool_result {
  border-color: rgba(22, 163, 74, 0.16);
  background: rgba(22, 163, 74, 0.06);
}

.agent-step--error {
  border-color: rgba(220, 38, 38, 0.16);
  background: rgba(220, 38, 38, 0.06);
}

.agent-step-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.agent-step-type {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid var(--app-accent-muted);
}

.agent-step--tool_call .agent-step-type {
  color: var(--app-accent);
}

.agent-step--tool_result .agent-step-type {
  color: var(--app-success);
  background: rgba(22, 163, 74, 0.08);
  border-color: rgba(22, 163, 74, 0.16);
}

.agent-step--error .agent-step-type {
  color: var(--app-danger);
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.16);
}

.agent-step-agent,
.agent-step-time {
  font-size: 11px;
  color: var(--app-text-faint);
}

.agent-step-tool {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-main);
}

.agent-step-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 11px;
  line-height: 1.55;
  color: var(--app-text-sub);
  font-family: var(--app-font-mono);
  max-height: 120px;
  overflow: auto;
}
</style>
