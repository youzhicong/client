<template>
  <div class="ai-platform-page ai-agent-shell">
    <AgentStudioHeader
      :title="title"
      :description="description"
      :active="active"
      compact
      :show-nav="false"
    >
      <template v-if="$slots.actions" #actions
        ><slot name="actions"
      /></template>
    </AgentStudioHeader>
    <section class="platform-workspace"><slot /></section>
  </div>
</template>
<script setup lang="ts">
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import type { AiModuleKey } from '@/config/ai-platform'
withDefaults(
  defineProps<{
    title: string
    description?: string
    active?: AiModuleKey | ''
  }>(),
  { description: '', active: '' }
)
</script>
<style scoped lang="scss">
@use '@/style/ai-agent-page.scss';
.ai-platform-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.platform-workspace {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 2px 24px;
}
</style>
