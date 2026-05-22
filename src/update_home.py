import re

file_path = r'd:\Servix\src\app\[locale]\home\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { countries, getCitiesOfCountry, professions, professionSpecializations } from '@/lib/data/locations'",
    "import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'"
)

# 2. Store
content = content.replace(
    "const { locale: storeLocale, country: storeCountry, city: storeCity } = useAppStore()",
    "const { locale: storeLocale, country: storeCountry, state: storeState, city: storeCity } = useAppStore()"
)

# 3. State Hooks
content = content.replace(
    "const [selectedCountry, setSelectedCountry] = useState(profile?.country_code || storeCountry || 'EG')\n  const [selectedCity, setSelectedCity] = useState(profile?.city || storeCity || '')",
    "const [selectedCountry, setSelectedCountry] = useState(profile?.country_code || storeCountry || 'EG')\n  const [selectedState, setSelectedState] = useState(profile?.state || storeState || '')\n  const [selectedCity, setSelectedCity] = useState(profile?.city || storeCity || '')"
)
content = content.replace(
    "const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})",
    "const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})\n  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})"
)

# 4. Profile sync
content = content.replace(
    "if (profile?.country_code) setSelectedCountry(profile.country_code)\n    if (profile?.city) setSelectedCity(profile.city)\n    if (professionalDetails?.profession) setSelectedProfession(professionalDetails.profession)\n  }, [profile?.id, professionalDetails?.id, profile?.country_code, profile?.city, professionalDetails?.profession])",
    "if (profile?.country_code) setSelectedCountry(profile.country_code)\n    if (profile?.state) setSelectedState(profile.state)\n    if (profile?.city) setSelectedCity(profile.city)\n    if (professionalDetails?.profession) setSelectedProfession(professionalDetails.profession)\n  }, [profile?.id, professionalDetails?.id, profile?.country_code, profile?.state, profile?.city, professionalDetails?.profession])"
)

# 5. Fetch logic
content = content.replace(
    "if (selectedCountry) query = query.eq('country_code', selectedCountry)\n      if (selectedCity) query = query.eq('city', selectedCity)",
    "if (selectedCountry) query = query.eq('country_code', selectedCountry)\n      if (selectedState) query = query.eq('state', selectedState)\n      if (selectedCity) query = query.eq('city', selectedCity)"
)
content = content.replace(
    "selectedCountry, selectedCity, sortBy]) // eslint-disable-line",
    "selectedCountry, selectedState, selectedCity, sortBy]) // eslint-disable-line"
)

# 6. Translate Effect
effect_old = """    const currentLocale = (locale || storeLocale) as string
    if (currentLocale === 'en') {
      setTranslatedCities({})
      setTranslatedProfs({})
      return
    }

    const cityList = selectedCountry ? getCitiesOfCountry(selectedCountry) : []
    const cityNames = cityList.map(c => c.name.en)
    const profNames = professions.map(p => p.name.en)
    const allTexts = [...cityNames, ...profNames]

    if (allTexts.length === 0) return

    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: currentLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const newCities: Record<string, string> = {}
        cityList.forEach((c, idx) => {
          newCities[c.id] = data[idx] || c.name.en
        })
        const newProfs: Record<string, string> = {}
        professions.forEach((p, idx) => {
          newProfs[p.id] = data[cityNames.length + idx] || p.name.en
        })
        setTranslatedCities(newCities)
        setTranslatedProfs(newProfs)
      })
      .catch(err => console.error('Translation error:', err))
    return () => { isMounted = false }
  }, [locale, storeLocale, selectedCountry])"""

effect_new = """    const currentLocale = (locale || storeLocale) as string
    if (currentLocale === 'en') {
      setTranslatedStates({})
      setTranslatedCities({})
      setTranslatedProfs({})
      return
    }

    const stateList = selectedCountry ? getStatesOfCountry(selectedCountry) : []
    const cityList = (selectedCountry && selectedState) ? getCitiesOfState(selectedCountry, selectedState) : []
    const stateNames = stateList.map(s => s.name.en)
    const cityNames = cityList.map(c => c.name.en)
    const profNames = professions.map(p => p.name.en)
    const allTexts = [...stateNames, ...cityNames, ...profNames]

    if (allTexts.length === 0) return

    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: currentLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const newStates: Record<string, string> = {}
        stateList.forEach((s, idx) => {
          newStates[s.id] = data[idx] || s.name.en
        })
        const newCities: Record<string, string> = {}
        cityList.forEach((c, idx) => {
          newCities[c.id] = data[stateNames.length + idx] || c.name.en
        })
        const newProfs: Record<string, string> = {}
        professions.forEach((p, idx) => {
          newProfs[p.id] = data[stateNames.length + cityNames.length + idx] || p.name.en
        })
        setTranslatedStates(newStates)
        setTranslatedCities(newCities)
        setTranslatedProfs(newProfs)
      })
      .catch(err => console.error('Translation error:', err))
    return () => { isMounted = false }
  }, [locale, storeLocale, selectedCountry, selectedState])"""
content = content.replace(effect_old, effect_new)

# 7. Helpers
content = content.replace("const currentCities = selectedCountry ? getCitiesOfCountry(selectedCountry) : []", "const currentStates = selectedCountry ? getStatesOfCountry(selectedCountry) : []\n  const currentCities = (selectedCountry && selectedState) ? getCitiesOfState(selectedCountry, selectedState) : []")
content = content.replace("setSelectedCountry('')\n    setSelectedCity('')", "setSelectedCountry('')\n    setSelectedState('')\n    setSelectedCity('')")
content = content.replace("hasActiveFilters = selectedProfession || selectedCountry || selectedCity || sortBy !== 'rating'", "hasActiveFilters = selectedProfession || selectedCountry || selectedState || selectedCity || sortBy !== 'rating'")


# 8. Add State Filter dropdown
dropdowns_old = """          {/* Country */}
          <div className="relative min-w-[100px]">
            <select
              value={selectedCountry}
              onChange={e => { setSelectedCountry(e.target.value); setSelectedCity('') }}
              title={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              aria-label={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code} className="bg-gray-900">{c.name[activeLocale as keyof typeof c.name] || c.name.en}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* City */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              title={activeLocale === 'ar' ? 'اختر المدينة' : 'Select City'}
              aria-label={activeLocale === 'ar' ? 'اختر المدينة' : 'Select City'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              {currentCities.length > 0
                ? currentCities.map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {translatedCities[c.id] || c.name.en}
                    </option>
                  ))
                : <option value="">{activeLocale === 'ar' ? 'المدينة' : t('city')}</option>
              }
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>"""

dropdowns_new = """          {/* Country */}
          <div className="relative min-w-[100px]">
            <select
              value={selectedCountry}
              onChange={e => { setSelectedCountry(e.target.value); setSelectedState(''); setSelectedCity('') }}
              title={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              aria-label={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code} className="bg-gray-900">{c.name[activeLocale as keyof typeof c.name] || c.name.en}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* State */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedState}
              onChange={e => { setSelectedState(e.target.value); setSelectedCity('') }}
              title={activeLocale === 'ar' ? 'اختر المحافظة' : 'Select State'}
              aria-label={activeLocale === 'ar' ? 'اختر المحافظة' : 'Select State'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              <option value="">{activeLocale === 'ar' ? 'المحافظة' : 'State'}</option>
              {currentStates.map(s => (
                <option key={s.id} value={s.id} className="bg-gray-900">
                  {translatedStates[s.id] || s.name.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* City */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              title={activeLocale === 'ar' ? 'اختر المنطقة' : 'Select Region'}
              aria-label={activeLocale === 'ar' ? 'اختر المنطقة' : 'Select Region'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              <option value="">{activeLocale === 'ar' ? 'المنطقة' : 'Region'}</option>
              {currentCities.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">
                  {translatedCities[c.id] || c.name.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>"""

content = content.replace(dropdowns_old, dropdowns_new)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
