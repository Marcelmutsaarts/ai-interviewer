'use client'

import { ReactNode } from 'react'

interface ParticipantLayoutProps {
  children: ReactNode
}

export default function ParticipantLayout({ children }: ParticipantLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <main id="main-content" className="flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}
