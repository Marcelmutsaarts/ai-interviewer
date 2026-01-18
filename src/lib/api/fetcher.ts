/**
 * Shared API fetcher utility for SWR hooks.
 * Provides consistent error handling with Dutch error messages.
 */

/**
 * Custom error class for API errors with status code information.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Default error messages in Dutch for common HTTP status codes.
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Ongeldige aanvraag',
  401: 'Niet ingelogd',
  403: 'Geen toegang',
  404: 'Niet gevonden',
  500: 'Serverfout',
  502: 'Server niet bereikbaar',
  503: 'Service tijdelijk niet beschikbaar',
}

/**
 * Gets a Dutch error message for the given status code.
 */
function getErrorMessage(status: number, fallback: string): string {
  return DEFAULT_ERROR_MESSAGES[status] || fallback
}

/**
 * Generic typed fetcher for SWR hooks.
 * Handles errors consistently with Dutch error messages.
 *
 * @param url - The URL to fetch
 * @returns Promise resolving to the parsed JSON response
 * @throws ApiError if the response is not ok
 *
 * @example
 * ```ts
 * const { data } = useSWR<Project[]>('/api/projects', fetcher)
 * ```
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    // Try to extract error message from response body
    let errorMessage: string
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error || errorBody.message || getErrorMessage(response.status, 'Fout bij ophalen')
    } catch {
      errorMessage = getErrorMessage(response.status, 'Fout bij ophalen')
    }

    throw new ApiError(errorMessage, response.status, response.statusText)
  }

  return response.json()
}

/**
 * Creates a fetcher with a custom base error message.
 * Useful when you want to provide context-specific error messages.
 *
 * @param resourceName - The name of the resource being fetched (in Dutch)
 * @returns A fetcher function with customized error messages
 *
 * @example
 * ```ts
 * const projectFetcher = createFetcher('project')
 * const { data } = useSWR<Project>('/api/projects/123', projectFetcher)
 * // Error message: "Kan project niet ophalen"
 * ```
 */
export function createFetcher<T>(resourceName: string) {
  return async (url: string): Promise<T> => {
    const response = await fetch(url)

    if (!response.ok) {
      let errorMessage: string
      try {
        const errorBody = await response.json()
        errorMessage = errorBody.error || errorBody.message || `Kan ${resourceName} niet ophalen`
      } catch {
        errorMessage = `Kan ${resourceName} niet ophalen`
      }

      throw new ApiError(errorMessage, response.status, response.statusText)
    }

    return response.json()
  }
}

/**
 * Type-safe fetcher that accepts a function to fetch the data.
 * Useful for fetchers that need custom logic or parameters.
 *
 * @param fetchFn - The fetch function to execute
 * @returns Promise resolving to the parsed JSON response
 *
 * @example
 * ```ts
 * const { data } = useSWR(
 *   projectId ? `config-${projectId}` : null,
 *   () => fetchWithHandler(() => fetch(`/api/projects/${projectId}/config`), 'configuratie')
 * )
 * ```
 */
export async function fetchWithHandler<T>(
  fetchFn: () => Promise<Response>,
  resourceName: string
): Promise<T> {
  const response = await fetchFn()

  if (!response.ok) {
    let errorMessage: string
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error || errorBody.message || `Kan ${resourceName} niet ophalen`
    } catch {
      errorMessage = `Kan ${resourceName} niet ophalen`
    }

    throw new ApiError(errorMessage, response.status, response.statusText)
  }

  return response.json()
}
