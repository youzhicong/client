<template>
  <div
    class="page-panel page-stat-card"
    :class="tone ? `tone-${tone}` : undefined"
  >
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'PageStatCard'
})

withDefaults(
  defineProps<{
    label: string
    value: string | number
    tone?: 'warning' | 'danger' | 'success'
  }>(),
  {
    tone: undefined
  }
)
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
@use '@/style/workflow-page.scss';
</style>
