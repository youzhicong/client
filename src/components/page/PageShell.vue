<template>
  <div class="page-shell">
    <slot name="hero" />
    <slot name="stats" />
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'PageShell'
})
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
