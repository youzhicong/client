<template>
  <el-table
    class="app-data-table"
    :data="data"
    :border="border"
    :stripe="stripe"
    :height="height"
    :max-height="maxHeight"
    :size="size"
    :row-class-name="rowClassName"
    v-bind="attrs"
  >
    <slot />
    <template #empty>
      <slot name="empty">
        <el-empty :description="emptyText" />
      </slot>
    </template>
  </el-table>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import type { TableProps } from 'element-plus'

defineOptions({
  name: 'AppDataTable',
  inheritAttrs: false
})

type TableSize = '' | 'default' | 'small' | 'large'
type TableRow = Record<PropertyKey, unknown>

withDefaults(
  defineProps<{
    data: TableRow[]
    border?: boolean
    stripe?: boolean
    height?: string | number
    maxHeight?: string | number
    size?: TableSize
    rowClassName?: TableProps<TableRow>['rowClassName']
    emptyText?: string
  }>(),
  {
    data: () => [],
    border: false,
    stripe: false,
    size: 'default',
    emptyText: '暂无数据'
  }
)

const attrs = useAttrs()
</script>
