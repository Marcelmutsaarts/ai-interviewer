import { cn } from '@/lib/utils/cn'

type BadgeStatus = 'active' | 'inactive' | 'completed' | 'abandoned' | 'in-progress'

interface StatusBadgeProps {
  status: BadgeStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  active: {
    label: 'Actief',
    className: 'bg-success-100 text-success-700',
  },
  inactive: {
    label: 'Inactief',
    className: 'bg-gray-100 text-gray-600',
  },
  completed: {
    label: 'Voltooid',
    className: 'bg-success-100 text-success-700',
  },
  abandoned: {
    label: 'Afgebroken',
    className: 'bg-error-100 text-error-700',
  },
  'in-progress': {
    label: 'Actief',
    className: 'bg-warning-100 text-warning-700',
  },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
