import re

file_path = r'd:\Servix\src\app\[locale]\profile\[id]\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { countries, getCitiesOfCountry, professions, professionSpecializations } from '@/lib/data/locations'",
    "import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'"
)


# 2. State translation logic
effect_old = """  // Translate the city name when profile or locale changes
  const [translatedCity, setTranslatedCity] = useState<string>('')
  useEffect(() => {
    if (!profile?.city || !profile?.country_code) { setTranslatedCity(profile?.city || ''); return }
    if (activeLocale === 'en') { setTranslatedCity(profile.city); return }
    const cityList = getCitiesOfCountry(profile.country_code)
    const cityObj = cityList.find(c => c.id === profile.city)
    if (!cityObj) { setTranslatedCity(profile.city); return }
    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [cityObj.name.en], locale: activeLocale })
    })
      .then(res => res.json())
      .then(data => { if (isMounted && Array.isArray(data)) setTranslatedCity(data[0] || cityObj.name.en) })
      .catch(() => setTranslatedCity(cityObj.name.en))
    return () => { isMounted = false }
  }, [profile?.city, profile?.country_code, activeLocale])

  const cityName = translatedCity || profile?.city || ''"""

effect_new = """  // Translate the state and city name when profile or locale changes
  const [translatedState, setTranslatedState] = useState<string>('')
  const [translatedCity, setTranslatedCity] = useState<string>('')
  
  useEffect(() => {
    if (!profile?.country_code) return
    let isMounted = true
    
    const translateLocations = async () => {
      let sName = profile.state
      let cName = profile.city
      
      const stateList = getStatesOfCountry(profile.country_code)
      const stateObj = stateList.find(s => s.id === profile.state)
      if (stateObj && activeLocale !== 'en') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: [stateObj.name.en], locale: activeLocale })
          })
          const data = await res.json()
          if (Array.isArray(data) && data[0]) sName = data[0]
        } catch (e) {}
      } else if (stateObj) {
        sName = stateObj.name.en
      }
      
      const cityList = (profile.country_code && profile.state) ? getCitiesOfState(profile.country_code, profile.state) : []
      const cityObj = cityList.find(c => c.id === profile.city)
      if (cityObj && activeLocale !== 'en') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: [cityObj.name.en], locale: activeLocale })
          })
          const data = await res.json()
          if (Array.isArray(data) && data[0]) cName = data[0]
        } catch (e) {}
      } else if (cityObj) {
        cName = cityObj.name.en
      }
      
      if (isMounted) {
        setTranslatedState(sName || profile.state || '')
        setTranslatedCity(cName || profile.city || '')
      }
    }
    
    translateLocations()
    return () => { isMounted = false }
  }, [profile?.city, profile?.state, profile?.country_code, activeLocale])

  const stateName = translatedState || profile?.state || ''
  const cityName = translatedCity || profile?.city || ''"""

content = content.replace(effect_old, effect_new)

# 3. Update the display
display_old = """<span className="text-sm font-bold text-white">{cityName}, {country?.name[activeLocale as keyof typeof country.name]}</span>"""
display_new = """<span className="text-sm font-bold text-white">{[cityName, stateName, country?.name[activeLocale as keyof typeof country.name]].filter(Boolean).join('، ')}</span>"""
content = content.replace(display_old, display_new)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
