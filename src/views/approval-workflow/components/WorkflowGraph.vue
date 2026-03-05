<template>
  <section class="workflow-graph">
    <header class="graph-header">
      <h3>流程可视化</h3>
      <div class="header-right">
        <el-tag :type="statusTagType" effect="light">{{ statusText }}</el-tag>
        <el-tag type="info" effect="plain">驳回次数 {{ rejectCount }}</el-tag>
      </div>
    </header>

    <div class="graph-track">
      <template v-for="(node, index) in nodes" :key="node.key">
        <article class="graph-node" :class="nodeClassMap[index]">
          <div class="node-index">{{ index + 1 }}</div>
          <div class="node-body">
            <h4>{{ node.title }}</h4>
            <p>{{ node.desc }}</p>
          </div>
        </article>
        <div
          v-if="index < nodes.length - 1"
          class="graph-line"
          :class="lineClassMap[index]"
        >
          <span class="line-core"></span>
          <el-icon class="line-arrow"><ArrowRight /></el-icon>
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import type { WorkflowStatus } from '@/services/approvalWorkflow'

type NodeState = 'done' | 'active' | 'pending' | 'dim'

const props = defineProps<{
  status: WorkflowStatus
  rejectCount: number
}>()

const nodes = [
  { key: 'start', title: '发起审批', desc: '提交申请表单' },
  { key: 'review', title: '主管审批', desc: '审批人处理申请' },
  { key: 'revise', title: '驳回修改', desc: '申请人补充并修正' },
  { key: 'finish', title: '审批完成', desc: '流程归档完成' }
]

const nodeStateMap = computed<NodeState[]>(() => {
  if (props.status === 'pending')
    return ['done', 'active', 'pending', 'pending']
  if (props.status === 'rejected') return ['done', 'done', 'active', 'pending']
  if (props.status === 'modified') return ['done', 'done', 'active', 'pending']
  if (props.status === 'approved') {
    return props.rejectCount > 0
      ? ['done', 'done', 'done', 'active']
      : ['done', 'done', 'dim', 'active']
  }
  return ['pending', 'pending', 'pending', 'pending']
})

const nodeClassMap = computed(() =>
  nodeStateMap.value.map((state) => `is-${state}`)
)

const lineClassMap = computed(() => {
  const states = nodeStateMap.value
  return states.slice(0, states.length - 1).map((state, index) => {
    const next = states[index + 1]
    if (state === 'done' && (next === 'done' || next === 'active'))
      return 'is-done'
    if (next === 'active') return 'is-active'
    return 'is-pending'
  })
})

const statusText = computed(() => {
  const map: Record<WorkflowStatus, string> = {
    pending: '审批中',
    rejected: '已驳回',
    modified: '待重新提交',
    approved: '已通过'
  }
  return map[props.status]
})

const statusTagType = computed(() => {
  const map: Record<WorkflowStatus, 'warning' | 'danger' | 'info' | 'success'> =
    {
      pending: 'warning',
      rejected: 'danger',
      modified: 'info',
      approved: 'success'
    }
  return map[props.status]
})
</script>

<style scoped lang="scss">
.workflow-graph {
  border: 1px solid #d8e7ef;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fcff 0%, #f2f8fd 100%);
  padding: 16px;
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.graph-header h3 {
  margin: 0;
  font-size: 16px;
  color: #153544;
}

.header-right {
  display: flex;
  gap: 8px;
}

.graph-track {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.graph-node {
  border-radius: 14px;
  border: 1px solid #d3e3ec;
  background: #fff;
  padding: 12px;
  min-height: 92px;
  display: flex;
  gap: 10px;
  transition: all 0.2s ease;
}

.node-index {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  background: #edf5fb;
  color: #4d6b7c;
}

.node-body h4 {
  margin: 0 0 4px;
  font-size: 14px;
  color: #1c3f4f;
}

.node-body p {
  margin: 0;
  font-size: 12px;
  color: #6d8391;
  line-height: 1.4;
}

.graph-node.is-done {
  border-color: #9fd7c8;
  background: linear-gradient(180deg, #f5fdf9 0%, #eaf8f2 100%);
}

.graph-node.is-done .node-index {
  background: #21a77a;
  color: #fff;
}

.graph-node.is-active {
  border-color: #5ca8d1;
  box-shadow: 0 8px 24px rgba(40, 112, 153, 0.18);
  background: linear-gradient(180deg, #eef8ff 0%, #dcedf9 100%);
}

.graph-node.is-active .node-index {
  background: #2f7fb2;
  color: #fff;
}

.graph-node.is-dim {
  opacity: 0.5;
}

.graph-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.line-core {
  width: 42px;
  height: 2px;
  border-radius: 999px;
  background: #d3e0e7;
}

.line-arrow {
  color: #adc2ce;
  font-size: 14px;
}

.graph-line.is-done .line-core {
  background: #29a676;
}

.graph-line.is-done .line-arrow {
  color: #29a676;
}

.graph-line.is-active .line-core {
  background: linear-gradient(90deg, #2f7fb2 0%, #7ab7dd 100%);
}

.graph-line.is-active .line-arrow {
  color: #2f7fb2;
}

@media (max-width: 1080px) {
  .graph-track {
    grid-template-columns: 1fr;
  }

  .graph-line {
    justify-content: center;
    transform: rotate(90deg);
    margin: 4px 0;
  }
}
</style>
