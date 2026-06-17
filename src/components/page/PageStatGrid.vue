<template>
  <div class="page-stat-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'PageStatGrid'
})

const props = withDefaults(
  defineProps<{
    columns?: number
  }>(),
  {
    columns: 3
  }
)

const gridStyle = computed(() => ({
  '--page-stat-columns': String(props.columns)
}))
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
