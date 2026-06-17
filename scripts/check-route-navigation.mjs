import fs from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const rootDir = process.cwd()
const navigationPath = path.join(rootDir, 'src/config/navigation.ts')
const routesPath = path.join(rootDir, 'src/config/routes.ts')

const jiti = createJiti(import.meta.url)
const { routeNameByPath } = jiti('../src/config/routes.ts')

const readText = (filePath) => fs.readFileSync(filePath, 'utf8')

const collectNavigationPaths = (content) => {
  const paths = new Set()

  for (const match of content.matchAll(/index:\s*'([^']+)'/gu)) {
    paths.add(match[1])
  }

  for (const match of content.matchAll(/matchPaths:\s*\[([\s\S]*?)\]/gu)) {
    for (const pathMatch of match[1].matchAll(/'([^']+)'/gu)) {
      paths.add(pathMatch[1])
    }
  }

  return paths
}

const collectMenuRouteNames = (content) => {
  const items = []

  for (const match of content.matchAll(
    /\{\s*\n\s*index:\s*'([^']+)'([\s\S]*?)\n\s*\}/gu
  )) {
    const routeNameMatch = match[2].match(/routeName:\s*'([^']+)'/)
    if (routeNameMatch) {
      items.push({ index: match[1], routeName: routeNameMatch[1] })
    }
  }

  return items
}

const collectRouterPaths = (content) => {
  const paths = []

  for (const match of content.matchAll(/path:\s*'([^']+)'/gu)) {
    paths.push(match[1])
  }

  return paths
}

const matchesRoute = (menuPath, routePaths) => {
  if (routePaths.includes(menuPath)) return true

  return routePaths.some((routePath) => {
    if (routePath.includes(':')) {
      const prefix = routePath.split('/:')[0]
      return menuPath === prefix || menuPath.startsWith(`${prefix}/`)
    }

    return (
      routePath.startsWith(`${menuPath}/`) || menuPath.startsWith(`${routePath}/`)
    )
  })
}

const navigationContent = readText(navigationPath)
const routesContent = readText(routesPath)
const navigationPaths = collectNavigationPaths(navigationContent)
const routerPaths = collectRouterPaths(routesContent)
const menuRouteNames = collectMenuRouteNames(navigationContent)

const missingRoutes = [...navigationPaths].filter(
  (menuPath) => !matchesRoute(menuPath, routerPaths)
)

const routeNameMismatches = menuRouteNames.filter((item) => {
  const expected = routeNameByPath[item.index]
  return !expected || expected !== item.routeName
})

let hasError = false

if (missingRoutes.length) {
  hasError = true
  console.error('Navigation paths missing in router:')
  for (const menuPath of missingRoutes.sort()) {
    console.error(`- ${menuPath}`)
  }
}

if (routeNameMismatches.length) {
  hasError = true
  console.error('Menu routeName mismatches:')
  for (const item of routeNameMismatches) {
    const expected = routeNameByPath[item.index] || '(missing route name)'
    console.error(
      `- ${item.index}: menu routeName "${item.routeName}" != router name "${expected}"`
    )
  }
}

if (hasError) {
  process.exitCode = 1
} else {
  console.log(
    `Route/navigation checks passed (${navigationPaths.size} menu paths, ${menuRouteNames.length} routeName bindings verified).`
  )
}
