export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'pcdemo-theme'

const mode = ref<ThemeMode>('light')
const isDark = computed(() => mode.value === 'dark')

const resolveStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : null
}

const resolveSystemTheme = (): ThemeMode => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

const persistTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
}

const setTheme = (theme: ThemeMode) => {
  mode.value = theme
  persistTheme(theme)
  applyThemeToDocument(theme)
  return theme
}

const toggleTheme = () => setTheme(isDark.value ? 'light' : 'dark')

const initTheme = () => {
  const theme = resolveStoredTheme() ?? resolveSystemTheme()
  mode.value = theme
  applyThemeToDocument(theme)
  return theme
}

export const useTheme = () => ({
  mode,
  isDark,
  setTheme,
  toggleTheme,
  initTheme
})
