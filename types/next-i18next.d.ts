import 'next-i18next'

declare module 'next-i18next' {
  interface Resources {
    common: typeof import('../public/locales/ja/common.json')
  }
}