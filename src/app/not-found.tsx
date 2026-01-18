import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Pagina niet gevonden
        </h1>
        <p className="text-gray-600 mb-6">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/"
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'px-4 py-2 text-sm',
            'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
          )}
        >
          Terug naar home
        </Link>
      </div>
    </div>
  )
}
