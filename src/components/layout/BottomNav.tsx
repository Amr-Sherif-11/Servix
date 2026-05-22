'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, MessageCircle, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface BottomNavProps {
  locale: string
}

export default function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const tabs = [
    { href: `/${locale}/home`, icon: Home, label: t('home') },
    { href: `/${locale}/requests`, icon: FileText, label: t('requests') },
    { href: `/${locale}/messages`, icon: MessageCircle, label: t('messages') },
    { href: `/${locale}/profile/me`, icon: User, label: t('profile') },
  ]

  return (
    <nav className="bottom-nav">
      <div className="max-w-screen-sm mx-auto flex items-center">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className={`relative p-2.5 rounded-2xl transition-all duration-300 border-2 ${
                isActive 
                  ? 'bg-brand-500/20 border-brand-500 shadow-lg shadow-brand-500/20 scale-105' 
                  : 'bg-transparent border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-brand-400' : 'text-gray-400'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
