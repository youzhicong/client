<template>
  <div class="agent-message-content">
    <p v-if="plain" class="ai-agent-msg-text">{{ content }}</p>
    <div v-else class="ai-agent-msg-md" v-html="html" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/render-markdown'

defineOptions({
  name: 'AgentMessageContent'
})

const props = withDefaults(
  defineProps<{
    content: string
    plain?: boolean
  }>(),
  {
    plain: false
  }
)

const html = computed(() => renderMarkdown(props.content))
</script>

<style scoped lang="scss">
.agent-message-content {
  min-width: 0;
}
.ai-agent-msg-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-agent-msg-md {
  font-size: 14px;
  line-height: 1.7;
  color: inherit;
  word-break: break-word;
}
.ai-agent-msg-md :deep(.md-p) {
  margin: 0 0 10px;
}
.ai-agent-msg-md :deep(.md-p:last-child) {
  margin-bottom: 0;
}
.ai-agent-msg-md :deep(.md-h2),
.ai-agent-msg-md :deep(.md-h3),
.ai-agent-msg-md :deep(.md-h4) {
  margin: 0 0 8px;
  color: var(--app-text-main);
  font-weight: 700;
  line-height: 1.35;
}
.ai-agent-msg-md :deep(.md-h2) {
  font-size: 16px;
}
.ai-agent-msg-md :deep(.md-h3) {
  font-size: 15px;
}
.ai-agent-msg-md :deep(.md-h4) {
  font-size: 14px;
}
.ai-agent-msg-md :deep(.md-ul),
.ai-agent-msg-md :deep(.md-ol) {
  margin: 0 0 10px;
  padding-left: 20px;
}
.ai-agent-msg-md :deep(.md-ul li),
.ai-agent-msg-md :deep(.md-ol li) {
  margin-bottom: 4px;
}
.ai-agent-msg-md :deep(.md-code) {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  font-family: var(--app-font-mono);
  font-size: 12px;
}
.ai-agent-msg-md :deep(.md-pre) {
  margin: 0 0 10px;
  padding: 12px 14px;
  overflow-x: auto;
  border-radius: 10px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
}
.ai-agent-msg-md :deep(.md-pre code) {
  font-family: var(--app-font-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-agent-msg-md :deep(strong) {
  font-weight: 700;
  color: var(--app-text-main);
}
</style>
