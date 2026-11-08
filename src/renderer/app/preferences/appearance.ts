import type { Preferences, Theme } from '@shared/contracts'

export function resolveDarkTheme(theme: Theme, systemDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && systemDark)
}

// One subscription owns DOM appearance; the selected preference is the only stored state.
export function bindAppearance(
  read: () => Preferences,
  subscribe: (listener: () => void) => () => void,
  media: MediaQueryList,
  root: HTMLElement,
) {
  const apply = () => {
    const preferences = read()
    const dark = resolveDarkTheme(preferences.theme, media.matches)
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    root.lang = preferences.locale
  }
  apply()
  const unsubscribe = subscribe(apply)
  media.addEventListener('change', apply)
  return () => {
    unsubscribe()
    media.removeEventListener('change', apply)
  }
}
