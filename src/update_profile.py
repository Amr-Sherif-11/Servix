import re

file_path = r'd:\Servix\src\app\[locale]\profile\me\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { countries, getCitiesOfCountry, professions, professionSpecializations } from '@/lib/data/locations'",
    "import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'"
)

# 2. Store
content = content.replace(
    "const { locale, country, city, darkMode, setLocale, setCountry, setCity, toggleDarkMode } = useAppStore()",
    "const { locale, country, state, city, darkMode, setLocale, setCountry, setState, setCity, toggleDarkMode } = useAppStore()"
)

# 3. State Hooks
content = content.replace(
    "const [countrySearch, setCountrySearch] = useState('')\n  const [citySearch, setCitySearch] = useState('')",
    "const [countrySearch, setCountrySearch] = useState('')\n  const [stateSearch, setStateSearch] = useState('')\n  const [citySearch, setCitySearch] = useState('')"
)
content = content.replace(
    "const [showCountrySelect, setShowCountrySelect] = useState(false)\n  const [showCitySelect, setShowCitySelect] = useState(false)\n  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})",
    "const [showCountrySelect, setShowCountrySelect] = useState(false)\n  const [showStateSelect, setShowStateSelect] = useState(false)\n  const [showCitySelect, setShowCitySelect] = useState(false)\n  const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})\n  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})"
)

# 4. Handle Save Payload
content = content.replace(
    "country_code: country || null,\n        city: city || null,",
    "country_code: country || null,\n        state: state || null,\n        city: city || null,"
)

# 5. Helpers
content = content.replace(
    "const currentCities = country ? getCitiesOfCountry(country) : []",
    "const currentStates = country ? getStatesOfCountry(country) : []\n  const currentCities = (country && state) ? getCitiesOfState(country, state) : []"
)

# 6. Translate Effect
effect_old = """  // Translate city names when locale or country changes
  useEffect(() => {
    if (activeLocale === 'en') { setTranslatedCities({}); return }
    const cityList = country ? getCitiesOfCountry(country) : []
    if (cityList.length === 0) return
    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: cityList.map(c => c.name.en), locale: activeLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const result: Record<string, string> = {}
        cityList.forEach((c, i) => { result[c.id] = data[i] || c.name.en })
        setTranslatedCities(result)
      })
      .catch(err => console.error('City translation error:', err))
    return () => { isMounted = false }
  }, [activeLocale, country])"""

effect_new = """  // Translate state and city names when locale or country/state changes
  useEffect(() => {
    if (activeLocale === 'en') { setTranslatedStates({}); setTranslatedCities({}); return }
    const stateList = country ? getStatesOfCountry(country) : []
    const cityList = (country && state) ? getCitiesOfState(country, state) : []
    const stateNames = stateList.map(s => s.name.en)
    const cityNames = cityList.map(c => c.name.en)
    const allTexts = [...stateNames, ...cityNames]
    
    if (allTexts.length === 0) return
    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: activeLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const newStates: Record<string, string> = {}
        stateList.forEach((s, i) => { newStates[s.id] = data[i] || s.name.en })
        const newCities: Record<string, string> = {}
        cityList.forEach((c, i) => { newCities[c.id] = data[stateNames.length + i] || c.name.en })
        setTranslatedStates(newStates)
        setTranslatedCities(newCities)
      })
      .catch(err => console.error('Translation error:', err))
    return () => { isMounted = false }
  }, [activeLocale, country, state])"""

content = content.replace(effect_old, effect_new)

# 7. Add State Dropdown and fix UI logic
content = content.replace("setCountry(c.code);\n                              setCity('');", "setCountry(c.code);\n                              setState('');\n                              setCity('');")
content = content.replace("(supabase.from('profiles') as any).update({ country_code: c.code, city: null }).eq('id', user.id).then();", "(supabase.from('profiles') as any).update({ country_code: c.code, state: null, city: null }).eq('id', user.id).then();")

state_ui = """            {countryData && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <span className="font-medium text-gray-900 dark:text-white">{activeLocale === 'ar' ? 'المحافظة' : 'State'}</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStateSelect(!showStateSelect)}
                    className="w-full input-field text-sm flex items-center justify-between"
                  >
                    <span className={state ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {(state && (translatedStates[state] || currentStates.find(s => s.id === state)?.name.en)) || (activeLocale === 'ar' ? 'المحافظة' : 'State')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStateSelect ? 'rotate-180' : ''}`} />
                  </button>

                  {showStateSelect && (
                    <div className="absolute z-50 w-full mt-2 glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            autoFocus
                            value={stateSearch}
                            onChange={e => setStateSearch(e.target.value)}
                            placeholder={tCommon('search')}
                            className={`w-full bg-white/5 border-none text-xs py-2 ${isRTL ? 'pr-9 text-right' : 'pl-9 text-left'} focus:ring-0 text-white`}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {currentStates
                          .filter(s => (translatedStates[s.id] || s.name.en).toLowerCase().includes(stateSearch.toLowerCase()))
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setState(s.id);
                                setCity('');
                                setShowStateSelect(false);
                                setStateSearch('');
                                if (user) {
                                  (supabase.from('profiles') as any).update({ state: s.id, city: null }).eq('id', user.id).then();
                                }
                              }}
                              className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm hover:bg-white/10 transition-colors ${
                                state === s.id ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-gray-300'
                              }`}
                            >
                              {translatedStates[s.id] || s.name.en}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

"""
# Insert state UI before city UI
content = content.replace("{countryData && (\n              <div className=\"px-4 py-3\">\n                <div className=\"flex items-center gap-3 mb-2\">", state_ui + "{countryData && state && (\n              <div className=\"px-4 py-3\">\n                <div className=\"flex items-center gap-3 mb-2\">")


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
