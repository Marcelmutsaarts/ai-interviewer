'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/organisms/Header/AdminHeader'
import { Spinner } from '@/components/atoms'
import { useAuthStore } from '@/stores/authStore'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { admin, logout, checkSession } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verify = async () => {
      const isValid = await checkSession()
      if (!isValid) {
        router.replace('/login')
      }
      setIsChecking(false)
    }
    verify()
  }, [checkSession, router])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader userName={admin.name} onLogout={handleLogout} />
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
