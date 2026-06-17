<template>
  <div class="page-panel" :class="bodyClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'PagePanel'
})

withDefaults(
  defineProps<{
    bodyClass?: string
  }>(),
  {
    bodyClass: 'page-panel-body'
  }
)
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
