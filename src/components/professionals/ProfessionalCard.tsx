import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/config'
import { professions, professionSpecializations } from '@/lib/data/locations'

interface ProfessionalCardProps {
  professional: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    state: string | null
    city: string | null
    country_code: string | null
    professional_details: {
      profession: string | null
      rating: number
      total_reviews: number
      price: number | null
      currency: string | null
      is_available: boolean
      specialization: string | null
      bio: string | null
    } | null
  }
  locale: Locale
  /** Pre-translated state names keyed by state id, provided by the parent */
  translatedStates?: Record<string, string>
  /** Pre-translated city names keyed by city id, provided by the parent */
  translatedCities?: Record<string, string>
}

export default function ProfessionalCard({ professional: p, locale, translatedStates = {}, translatedCities = {} }: ProfessionalCardProps) {
  const t = useTranslations('home')
  const details = p.professional_details
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ')
  
  const professionName = professions.find(pr => pr.id === details?.profession)?.name[locale as keyof (typeof professions)[0]['name']] 
    || details?.profession || ''
    
  const specName = details?.profession && details?.specialization 
    ? professionSpecializations[details.profession]?.find(s => s.id === details.specialization)?.[locale === 'ar' ? 'ar' : 'en']
    : null
  
  // Use pre-translated location names from parent; fall back to raw id
  const stateName = (p.state && translatedStates[p.state]) || p.state || ''
  const cityName = (p.city && translatedCities[p.city]) || p.city || ''
  
  const locationText = [cityName, stateName].filter(Boolean).join('، ')

  return (
    <Link href={`/${locale}/profile/${p.id}`} className="card p-5 flex gap-5 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-500 hover:-translate-y-1.5 group">
      <div className="relative flex-shrink-0">
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-indigo-600 overflow-hidden shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-500">
          {p.avatar_url ? (
            <Image src={p.avatar_url} alt={fullName} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">
              {(p.first_name?.[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        {details?.is_available && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-950 rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-white truncate text-lg">{p.first_name} <span className="text-brand-500">{p.last_name}</span></h3>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <div className="bg-brand-500/10 text-brand-400 p-1 rounded-md">
                  <Briefcase className="w-3 h-3" />
                </div>
                <p className="text-xs text-brand-400 font-bold">{professionName}</p>
              </div>
              {specName && (
                <p className="text-[10px] text-gray-400 font-medium px-1.5">{specName}</p>
              )}
            </div>
          </div>
          {details?.price && (
            <div className="text-right flex-shrink-0 bg-gray-800/40 border border-white/5 p-2 rounded-xl">
              <span className="text-base font-black text-white">{details.price}</span>
              <span className="text-[10px] text-gray-500 block uppercase font-black tracking-tighter">{details.currency}</span>
            </div>
          )}
        </div>

        {details?.bio && (
          <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 leading-relaxed italic opacity-80">
            {details.bio}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {details && (
              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                <Star className="w-3 h-3 fill-yellow-500" />
                <span className="text-[10px] font-black">{details.rating.toFixed(1)}</span>
              </div>
            )}
            {locationText && (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] font-bold truncate max-w-[150px]">{locationText}</span>
              </div>
            )}
          </div>
          {details?.is_available && (
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[9px] font-black border border-green-500/20">
              <span className="w-1 h-1 bg-green-500 rounded-full" />
              {locale === 'ar' ? 'متاح الآن' : t('availableNow', { defaultValue: 'Available Now' })}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
