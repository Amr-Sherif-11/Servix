import re

file_path = r'd:\Servix\src\app\auth\register\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { countries, getCitiesOfCountry, professions, professionSpecializations, type CountryData } from '@/lib/data/locations'",
    "import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations, type CountryData } from '@/lib/data/locations'"
)

# 2. Update store extraction
content = content.replace(
    "locale: storeLocale, country: storeCountry, city: storeCity,",
    "locale: storeLocale, country: storeCountry, state: storeState, city: storeCity,"
)
content = content.replace(
    "setLocale, setCountry, setCity",
    "setLocale, setCountry, setState, setCity"
)

# 3. Update temp states
content = content.replace(
    "const [tempCountry, setTempCountry] = useState(storeCountry || 'EG')\n  const [tempCity, setTempCity] = useState(storeCity || '')",
    "const [tempCountry, setTempCountry] = useState(storeCountry || 'EG')\n  const [tempState, setTempState] = useState(storeState || '')\n  const [tempCity, setTempCity] = useState(storeCity || '')"
)

# 4. Update translation placeholders in `t` object (fallback generic approach)
content = content.replace("city: 'City',", "state: 'State/Governorate',\n      city: 'City/Region',")
content = content.replace("city: 'المدينة',", "state: 'المحافظة / الولاية',\n      city: 'المنطقة',")
content = content.replace("city: 'Ville',", "state: 'État/Gouvernorat',\n      city: 'Ville/Région',")
content = content.replace("searchCity: 'Search cities...',", "searchState: 'Search states...',\n      searchCity: 'Search cities...',")
content = content.replace("searchCity: 'البحث عن مدينة...',", "searchState: 'البحث عن محافظة...',\n      searchCity: 'البحث عن منطقة...',")
content = content.replace("searchCity: 'Rechercher une ville...',", "searchState: 'Rechercher un état...',\n      searchCity: 'Rechercher une ville...',")

# 5. current states and cities
content = content.replace(
    "const currentCities = tempCountry ? getCitiesOfCountry(tempCountry) : []",
    "const currentStates = tempCountry ? getStatesOfCountry(tempCountry) : []\n  const currentCities = (tempCountry && tempState) ? getCitiesOfState(tempCountry, tempState) : []"
)

# 6. translatedStates
content = content.replace(
    "const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})",
    "const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})\n  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})"
)

# 7. Translation effect inside useEffect
effect_old = """    const cityObj = tempCountry ? getCitiesOfCountry(tempCountry) : []
    const cityNames = cityObj.map(c => c.name.en || c.id)

    const profNames = professions.map(p => p.name?.en || p.id)"""

effect_new = """    const stateObj = tempCountry ? getStatesOfCountry(tempCountry) : []
    const cityObj = (tempCountry && tempState) ? getCitiesOfState(tempCountry, tempState) : []
    
    const stateNames = stateObj.map(s => s.name.en || s.id)
    const cityNames = cityObj.map(c => c.name.en || c.id)

    const profNames = professions.map(p => p.name?.en || p.id)"""
content = content.replace(effect_old, effect_new)

all_texts_old = "const allTexts = [...cityNames, ...profNames, ...specNames]"
all_texts_new = "const allTexts = [...stateNames, ...cityNames, ...profNames, ...specNames]"
content = content.replace(all_texts_old, all_texts_new)

arr_map_old = """        const newCities: Record<string, string> = {}
        cityObj.forEach((c, idx) => {
          newCities[c.id] = arr[idx] || c.name.en || c.id
        })

        const newProfs: Record<string, string> = {}
        professions.forEach((p, idx) => {
          newProfs[p.id] = arr[cityObj.length + idx] || p.name[tempLocale] || p.name?.en || p.id
        })

        const newSpecs: Record<string, string> = {}
        specObj.forEach((s, idx) => {
          newSpecs[s.id] = arr[cityObj.length + professions.length + idx] || (tempLocale === 'ar' ? s.ar : s.en)
        })

        setTranslatedCities(newCities)"""

arr_map_new = """        const newStates: Record<string, string> = {}
        stateObj.forEach((s, idx) => {
          newStates[s.id] = arr[idx] || s.name.en || s.id
        })
        
        const newCities: Record<string, string> = {}
        cityObj.forEach((c, idx) => {
          newCities[c.id] = arr[stateObj.length + idx] || c.name.en || c.id
        })

        const newProfs: Record<string, string> = {}
        professions.forEach((p, idx) => {
          newProfs[p.id] = arr[stateObj.length + cityObj.length + idx] || p.name[tempLocale] || p.name?.en || p.id
        })

        const newSpecs: Record<string, string> = {}
        specObj.forEach((s, idx) => {
          newSpecs[s.id] = arr[stateObj.length + cityObj.length + professions.length + idx] || (tempLocale === 'ar' ? s.ar : s.en)
        })

        setTranslatedStates(newStates)
        setTranslatedCities(newCities)"""
content = content.replace(arr_map_old, arr_map_new)

effect_deps_old = "}, [tempCountry, tempLocale, currentProfession])"
effect_deps_new = "}, [tempCountry, tempState, tempLocale, currentProfession])"
content = content.replace(effect_deps_old, effect_deps_new)

# 8. Render dropdowns
grid_old = """                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.country}</label>
                    <SearchableSelect
                      options={countries.map(c => ({ id: c.code, label: c.name[tempLocale as keyof typeof c.name] || c.name.en }))}
                      value={tempCountry}
                      onChange={(val) => { setTempCountry(val); setTempCity('') }}
                      placeholder={txt.country}
                      searchPlaceholder={(txt as any).searchCountry}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.city}</label>
                    <SearchableSelect
                      options={currentCities.map(c => ({ id: c.id, label: translatedCities[c.id] || c.name.en || c.id }))}
                      value={tempCity}
                      onChange={(val) => setTempCity(val)}
                      placeholder={isTranslating ? (txt as any).loading || 'Loading...' : txt.city}
                      searchPlaceholder={(txt as any).searchCity}
                      disabled={!currentCountry || isTranslating}
                    />
                  </div>
                </div>"""

grid_new = """                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.country}</label>
                    <SearchableSelect
                      options={countries.map(c => ({ id: c.code, label: c.name[tempLocale as keyof typeof c.name] || c.name.en }))}
                      value={tempCountry}
                      onChange={(val) => { setTempCountry(val); setTempState(''); setTempCity('') }}
                      placeholder={txt.country}
                      searchPlaceholder={(txt as any).searchCountry}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{(txt as any).state || 'State'}</label>
                    <SearchableSelect
                      options={currentStates.map(s => ({ id: s.id, label: translatedStates[s.id] || s.name.en || s.id }))}
                      value={tempState}
                      onChange={(val) => { setTempState(val); setTempCity('') }}
                      placeholder={isTranslating ? (txt as any).loading || 'Loading...' : ((txt as any).state || 'State')}
                      searchPlaceholder={(txt as any).searchState || 'Search states...'}
                      disabled={!currentCountry || isTranslating}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.city}</label>
                    <SearchableSelect
                      options={currentCities.map(c => ({ id: c.id, label: translatedCities[c.id] || c.name.en || c.id }))}
                      value={tempCity}
                      onChange={(val) => setTempCity(val)}
                      placeholder={isTranslating ? (txt as any).loading || 'Loading...' : txt.city}
                      searchPlaceholder={(txt as any).searchCity}
                      disabled={!tempState || isTranslating}
                    />
                  </div>
                </div>"""

content = content.replace(grid_old, grid_new)

# 9. Form submission updates
content = content.replace("setCountry(tempCountry)\n      setCity(tempCity)", "setCountry(tempCountry)\n      setState(tempState)\n      setCity(tempCity)")
content = content.replace("country_code: tempCountry,\n          city: tempCity,", "country_code: tempCountry,\n          state: tempState,\n          city: tempCity,")

# 10. Fix Validation Condition
content = content.replace("if (!tempCountry || !tempCity) return", "if (!tempCountry || !tempState || !tempCity) return")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
