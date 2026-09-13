import { useEffect } from 'react'

const supportedLanguages = [
  'en', 'as', 'bn', 'brx', 'doi', 'gu', 'hi', 'kn', 'ks', 'kok', 'mai',
  'ml', 'mni', 'mr', 'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta', 'te', 'ur',
]

let widgetInitialized = false

export default function GoogleTranslate({ language }) {
  useEffect(() => {
    let languageTimer

    const applyLanguage = (targetLanguage) => {
      if (targetLanguage === 'auto' || targetLanguage === 'en') {
        const hasTranslationCookie = document.cookie
          .split('; ')
          .some((cookie) => cookie.startsWith('googtrans='))

        if (hasTranslationCookie) {
          document.cookie = 'googtrans=; Max-Age=0; path=/'
          document.cookie = `googtrans=; Max-Age=0; path=${window.location.pathname}`
          window.location.reload()
        }

        return true
      }

      const select = document.querySelector('.goog-te-combo')
      if (!select) return false

      select.value = targetLanguage
      select.dispatchEvent(new Event('change'))
      return true
    }

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return

      if (!widgetInitialized) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: supportedLanguages.join(','),
            autoDisplay: false,
          },
          'google_translate_element',
        )
        widgetInitialized = true
      }

      let attempts = 0
      languageTimer = window.setInterval(() => {
        if (applyLanguage(language) || attempts++ > 20) {
          window.clearInterval(languageTimer)
        }
      }, 100)
    }

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else {
      window.googleTranslateElementInit()
    }

    return () => {
      window.clearInterval(languageTimer)
    }
  }, [language])

  return (
    <div
      id="google_translate_element"
      className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
      aria-hidden="true"
    />
  )
}
