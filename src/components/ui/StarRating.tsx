import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export default function StarRating({ rating, max = 5, size = 'sm', interactive = false, onChange }: StarRatingProps) {
  const sizeClasses = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' }
  const cls = sizeClasses[size]

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            className={`${cls} transition-colors ${
              i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
