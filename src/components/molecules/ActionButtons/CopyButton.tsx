'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { ClipboardIcon, CheckCircleIcon } from '@/components/atoms/Icon/icons'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <CheckCircleIcon className="w-4 h-4 text-success-600" />
          Gekopieerd
        </>
      ) : (
        <>
          <ClipboardIcon className="w-4 h-4" />
          Kopieer
        </>
      )}
    </Button>
  )
}
