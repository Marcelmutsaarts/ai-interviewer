import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/atoms/Toast/ToastContainer'
import { SkipLink } from '@/components/atoms/SkipLink'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'AI Interviewer',
    template: '%s | AI Interviewer',
  },
  description:
    'Platform voor geautomatiseerde voice-to-voice interviews. Maak eenvoudig AI-gestuurde interviews voor HR, onderzoek en meer.',
  keywords: [
    'interview',
    'AI',
    'voice',
    'spraak',
    'HR',
    'onderzoek',
    'geautomatiseerd',
    'spraakherkenning',
    'transcriptie',
  ],
  authors: [{ name: 'AI Interviewer Team' }],
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'AI Interviewer',
    description:
      'Platform voor geautomatiseerde voice-to-voice interviews. Maak eenvoudig AI-gestuurde interviews.',
    siteName: 'AI Interviewer',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SkipLink />
        <main id="main-content">{children}</main>
        <ToastContainer />
      </body>
    </html>
  )
}
