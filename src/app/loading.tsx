import { Spinner } from '@/components/atoms/Spinner/Spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
      <span className="sr-only">Pagina wordt geladen</span>
    </div>
  )
}
