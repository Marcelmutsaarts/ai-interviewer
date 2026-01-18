'use client'

import { CheckCircleIcon } from '@/components/atoms/Icon/icons'

export default function InterviewCompletePage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedankt!</h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          Je interview is succesvol afgerond en opgeslagen. Je antwoorden worden
          anoniem verwerkt.
        </p>

        {/* Info box */}
        <div className="bg-white rounded-xl shadow-md p-6 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Wat gebeurt er nu?
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-gray-600">
                Je antwoorden worden geanalyseerd
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-gray-600">
                De beheerder ontvangt de resultaten
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-gray-600">
                Je deelname blijft volledig anoniem
              </span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-500">
          Je kunt dit venster nu sluiten.
        </p>
      </div>
    </div>
  )
}
