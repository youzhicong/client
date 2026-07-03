<template>
  <div class="page-shell" :class="{ 'page-shell--embedded': embedded }">
    <slot name="hero" />
    <slot name="stats" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useLotteryEmbedded } from '@/composables/useLotteryEmbedded'

defineOptions({
  name: 'PageShell'
})

const embedded = useLotteryEmbedded()
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
