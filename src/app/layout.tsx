import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Servix - Professional Services Marketplace',
  description: 'Connect with skilled professionals near you. Find plumbers, electricians, tutors and more.',
  keywords: 'professional services, marketplace, hire professionals, local services',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Servix',
    description: 'Connect with skilled professionals near you',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
