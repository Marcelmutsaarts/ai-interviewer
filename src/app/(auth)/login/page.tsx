'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextInput, PasswordInput } from '@/components/atoms'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema } from '@/lib/validation/schemas'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; password?: string; general?: string }>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const parseResult = loginSchema.safeParse({ name, password })
    if (!parseResult.success) {
      const fieldErrors: { name?: string; password?: string } = {}
      parseResult.error.issues.forEach((err) => {
        const field = err.path[0] as 'name' | 'password'
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    const result = await login(name, password)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setErrors({ general: result.error })
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Interviewer</h1>
          <p className="text-gray-600 mt-2">Log in om door te gaan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Naam
            </label>
            <TextInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Voer je naam in"
              error={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              autoComplete="username"
              autoFocus
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-error-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Wachtwoord
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Voer het wachtwoord in"
              error={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete="current-password"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-error-600" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {errors.general && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-3">
              <p className="text-sm text-error-700" role="alert">
                {errors.general}
              </p>
            </div>
          )}

          <Button type="submit" fullWidth loading={isLoading}>
            Inloggen
          </Button>
        </form>
      </div>
    </div>
  )
}
