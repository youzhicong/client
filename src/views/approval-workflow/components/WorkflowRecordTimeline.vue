<template>
  <section class="record-board">
    <header class="board-header">
      <h3>流转记录</h3>
      <span class="count">{{ records.length }} 条</span>
    </header>

    <el-timeline v-if="records.length">
      <el-timeline-item
        v-for="record in records"
        :key="record.id"
        :timestamp="record.createdAt"
        :type="actionTypeMap[record.action]"
      >
        <div class="record-title">
          <strong>{{ actionLabelMap[record.action] }}</strong>
          <el-tag size="small" effect="plain">{{ record.operator }}</el-tag>
        </div>
        <p class="record-comment">{{ record.comment || '无备注' }}</p>
      </el-timeline-item>
    </el-timeline>

    <el-empty v-else description="暂无流转记录" />
  </section>
</template>

<script lang="ts" setup>
import type { WorkflowRecord } from '@/services/approvalWorkflow'

defineProps<{
  records: WorkflowRecord[]
}>()

const actionLabelMap = {
  start: '发起审批',
  approve: '审批通过',
  reject: '审批驳回',
  modify: '提交修改',
  resubmit: '重新提交'
}

const actionTypeMap = {
  start: 'primary',
  approve: 'success',
  reject: 'danger',
  modify: 'warning',
  resubmit: 'primary'
} as const
</script>

<style scoped lang="scss">
.record-board {
  border: 1px solid #d8e7ef;
  border-radius: 20px;
  background: #fff;
  padding: 16px;
  min-height: 320px;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.board-header h3 {
  margin: 0;
  font-size: 16px;
  color: #153544;
}

.count {
  font-size: 12px;
  color: #6f8795;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-comment {
  margin: 6px 0 0;
  color: #4a6575;
  line-height: 1.5;
  font-size: 13px;
}
</style>
