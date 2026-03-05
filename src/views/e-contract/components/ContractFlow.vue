<template>
  <section class="flow-board">
    <header class="flow-header">
      <h3>签署流程</h3>
      <el-tag :type="statusType">{{ statusLabel }}</el-tag>
    </header>

    <div class="flow-track">
      <template v-for="(node, index) in flowNodes" :key="node.key">
        <div class="flow-node" :class="node.state">
          <div class="node-dot"></div>
          <div class="node-text">
            <strong>{{ node.title }}</strong>
            <p>{{ node.desc }}</p>
          </div>
        </div>
        <div
          v-if="index < flowNodes.length - 1"
          class="flow-line"
          :class="lineStates[index]"
        ></div>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ContractStatus } from '@/services/eContract'

const props = defineProps<{
  status: ContractStatus
}>()

const statusLabel = computed(() => {
  const map: Record<ContractStatus, string> = {
    draft: '草稿',
    pending_a: '待甲方签署',
    pending_b: '待乙方签署',
    rejected: '已驳回',
    completed: '已完成'
  }
  return map[props.status]
})

const statusType = computed(() => {
  const map: Record<ContractStatus, 'info' | 'warning' | 'danger' | 'success'> =
    {
      draft: 'info',
      pending_a: 'warning',
      pending_b: 'warning',
      rejected: 'danger',
      completed: 'success'
    }
  return map[props.status]
})

type NodeState = 'done' | 'active' | 'pending' | 'dim'

const flowNodes = computed(() => {
  const states: NodeState[] =
    props.status === 'draft'
      ? ['active', 'pending', 'pending', 'pending']
      : props.status === 'pending_a'
        ? ['done', 'active', 'pending', 'pending']
        : props.status === 'pending_b'
          ? ['done', 'done', 'active', 'pending']
          : props.status === 'completed'
            ? ['done', 'done', 'done', 'active']
            : ['done', 'dim', 'dim', 'active']

  const labels = [
    { key: 'draft', title: '创建合同', desc: '草稿编辑与确认' },
    { key: 'a', title: '甲方签署', desc: '甲方电子签章' },
    { key: 'b', title: '乙方签署', desc: '乙方电子签章' },
    { key: 'done', title: '归档完成', desc: '合同生效留档' }
  ]

  return labels.map((item, index) => ({ ...item, state: states[index] }))
})

const lineStates = computed(() => {
  const states = flowNodes.value.map((item) => item.state)
  return states.slice(0, states.length - 1).map((state, index) => {
    if (
      state === 'done' &&
      (states[index + 1] === 'done' || states[index + 1] === 'active')
    )
      return 'done'
    if (states[index + 1] === 'active') return 'active'
    return 'pending'
  })
})
</script>

<style scoped lang="scss">
.flow-board {
  border: 1px solid #d8e7ef;
  border-radius: 16px;
  background: #fff;
  padding: 14px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.flow-header h3 {
  margin: 0;
  font-size: 16px;
  color: #173b4a;
}

.flow-track {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

.flow-node {
  border: 1px solid #d5e5ee;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  gap: 10px;
  min-height: 80px;
}

.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  background: #cadbe5;
}

.node-text strong {
  display: block;
  font-size: 13px;
  color: #234758;
}

.node-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6e8794;
  line-height: 1.4;
}

.flow-node.done {
  background: #f0fcf7;
  border-color: #a9dec8;
}

.flow-node.done .node-dot {
  background: #22a777;
}

.flow-node.active {
  background: #edf7ff;
  border-color: #81badf;
}

.flow-node.active .node-dot {
  background: #2a80b7;
}

.flow-node.dim {
  opacity: 0.55;
}

.flow-line {
  width: 32px;
  height: 2px;
  background: #d5e2e9;
}

.flow-line.done {
  background: #25a576;
}

.flow-line.active {
  background: linear-gradient(90deg, #2a80b7 0%, #79badf 100%);
}

@media (max-width: 1080px) {
  .flow-track {
    grid-template-columns: 1fr;
  }

  .flow-line {
    width: 2px;
    height: 20px;
    margin: 0 auto;
  }
}
</style>
