'use client'

import Link from 'next/link'
import { Button } from '@/components/atoms'

interface AdminHeaderProps {
  userName: string
  onLogout: () => void
}

export function AdminHeader({ userName, onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">
              AI Interviewer
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welkom, <span className="font-medium">{userName}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Uitloggen
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
