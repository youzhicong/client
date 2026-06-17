<template>
  <div class="page-filter-bar">
    <div class="page-filter-group">
      <slot name="filters" />
    </div>
    <div v-if="$slots.extra" class="page-filter-extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'PageFilterBar'
})
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
