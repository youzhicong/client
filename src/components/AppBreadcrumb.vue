<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <span
          v-if="
            item.redirect === 'noRedirect' || index === breadcrumbs.length - 1
          "
          class="no-redirect"
        >
          {{ item.meta.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched } from 'vue-router'
import { resolveMenuItemByPath } from '@/config/navigation'

const route = useRoute()
const router = useRouter()
const breadcrumbs = ref<RouteLocationMatched[]>([])

const homeCrumb = {
  path: '/home',
  meta: { title: '首页' }
} as unknown as RouteLocationMatched

const isHome = (route: RouteLocationMatched) => {
  const name = route && route.name
  if (!name) {
    return false
  }
  return name.toString().trim().toLocaleLowerCase() === 'home'
}

const getBreadcrumb = () => {
  let matched = route.matched.filter((item) => item.meta && item.meta.title)
  const first = matched[0]

  if (!first || !isHome(first)) {
    matched = [homeCrumb, ...matched]
  }

  breadcrumbs.value = matched.filter(
    (item) => item.meta && item.meta.title && item.meta.breadcrumb !== false
  )

  const menuContext = resolveMenuItemByPath(route.path)
  if (menuContext && route.path !== '/home' && route.path !== '/business-hub') {
    const projectCrumb = {
      path: menuContext.project.homePath,
      meta: { title: menuContext.project.title }
    } as unknown as RouteLocationMatched

    const hasProjectCrumb = breadcrumbs.value.some(
      (item) => item.meta?.title === menuContext.project.title
    )

    if (!hasProjectCrumb) {
      const [rootCrumb, ...restCrumbs] = breadcrumbs.value
      breadcrumbs.value = rootCrumb
        ? [rootCrumb, projectCrumb, ...restCrumbs]
        : [homeCrumb, projectCrumb]
    }
  }
}

const handleLink = (item: RouteLocationMatched) => {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect as string)
    return
  }
  router.push(path)
}

watch(
  () => route.path,
  () => {
    getBreadcrumb()
  },
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .no-redirect {
    color: var(--app-text-sub);
    cursor: text;
  }
}
</style>
