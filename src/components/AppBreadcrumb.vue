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
import { defaultAppHomePath } from '@/config/portfolio'
import { productShortName } from '@/config/product'
import {
  resolveBreadcrumbProject,
  resolveMenuItemByPath
} from '@/config/navigation'

const route = useRoute()
const router = useRouter()
const breadcrumbs = ref<RouteLocationMatched[]>([])

const homeCrumb = {
  path: defaultAppHomePath,
  meta: { title: productShortName }
} as unknown as RouteLocationMatched

const isHome = (route: RouteLocationMatched) => {
  const name = route && route.name
  if (!name) {
    return false
  }
  const normalized = name.toString().trim().toLocaleLowerCase()
  return normalized === 'home' || normalized === 'ai-workflow'
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
  if (menuContext && route.path !== defaultAppHomePath) {
    const breadcrumbProject = resolveBreadcrumbProject(route.path)
    const projectCrumb = {
      path: breadcrumbProject.homePath,
      meta: { title: breadcrumbProject.title }
    } as unknown as RouteLocationMatched

    const hasProjectCrumb = breadcrumbs.value.some(
      (item) => item.meta?.title === breadcrumbProject.title
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
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  line-height: 1;
  margin-left: 0;

  :deep(.el-breadcrumb__inner),
  :deep(.el-breadcrumb__separator) {
    color: var(--app-text-faint);
    font-weight: 500;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: var(--app-text-main);
    font-weight: 600;
  }

  :deep(.el-breadcrumb__inner a) {
    color: var(--app-text-sub);
    font-weight: 500;
    transition: color 0.15s ease;

    &:hover {
      color: var(--app-accent);
    }
  }

  .no-redirect {
    color: var(--app-text-sub);
    cursor: text;
  }
}
</style>
