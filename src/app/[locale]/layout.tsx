import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, localeDir, type Locale } from '@/i18n/config'
import AuthProvider from '@/components/providers/AuthProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import ProgressBarProvider from '@/components/providers/ProgressBarProvider'
import Image from 'next/image'
import Link from 'next/link'


import GlobalRealtimeProvider from '@/components/providers/GlobalRealtimeProvider'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = localeDir[locale as Locale]

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head />
      <body className={locale === 'ar' ? 'font-arabic' : 'font-sans'}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <GlobalRealtimeProvider>
                <ProgressBarProvider>
                  <div className="relative min-h-screen">
                    {children}
                  </div>
                </ProgressBarProvider>
              </GlobalRealtimeProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
