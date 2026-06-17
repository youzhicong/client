<template>
  <div class="page-panel page-hero">
    <div>
      <span v-if="badge" class="page-hero-badge">{{ badge }}</span>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-hero-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'PageHero'
})

defineProps<{
  badge?: string
  title: string
  description?: string
}>()
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
