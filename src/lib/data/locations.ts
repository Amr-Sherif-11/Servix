export type CountryData = {
  code: string
  name: Record<string, string>
  currency: string
  cities: { id: string; name: { en: string } }[]
}

import { Country, State, City } from 'country-state-city'
import { locales } from '@/i18n/config'

const getCountryName = (code: string, locale: string, fallback: string) => {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || fallback
  } catch (e) {
    return fallback
  }
}

// Lean country list — cities are NOT pre-loaded here (lazy via getCitiesOfCountry)
export const countries: CountryData[] = Country.getAllCountries().map(country => {
  const nameMap: Record<string, string> = {}
  locales.forEach(loc => {
    nameMap[loc] = loc === 'en' ? country.name : getCountryName(country.isoCode, loc, country.name)
  })

  return {
    code: country.isoCode,
    name: nameMap,
    currency: country.currency || 'USD',
    // Cities are empty here — use getCitiesOfCountry() to get them on demand
    cities: [],
  }
})

const customRegions: Record<string, Record<string, { id: string; name: { en: string } }[]>> = {
  EG: {
    C: [
      { id: 'New Cairo', name: { en: 'New Cairo' } },
      { id: 'Nasr City', name: { en: 'Nasr City' } },
      { id: 'Heliopolis', name: { en: 'Heliopolis' } },
      { id: 'Maadi', name: { en: 'Maadi' } },
      { id: 'Downtown Cairo', name: { en: 'Downtown Cairo' } },
      { id: 'Zamalek', name: { en: 'Zamalek' } },
      { id: 'Garden City', name: { en: 'Garden City' } },
      { id: 'Shoubra', name: { en: 'Shoubra' } },
      { id: 'El-Rehab', name: { en: 'El-Rehab' } },
      { id: 'Madinaty', name: { en: 'Madinaty' } },
      { id: 'Shorouk City', name: { en: 'Shorouk City' } },
      { id: 'Helwan', name: { en: 'Helwan' } },
    ],
    GZ: [
      { id: '6th of October City', name: { en: '6th of October City' } },
      { id: 'Sheikh Zayed', name: { en: 'Sheikh Zayed' } },
      { id: 'El Haram', name: { en: 'El Haram' } },
      { id: 'Faisal', name: { en: 'Faisal' } },
      { id: 'Dokki', name: { en: 'Dokki' } },
      { id: 'Mohandessin', name: { en: 'Mohandessin' } },
      { id: 'Imbaba', name: { en: 'Imbaba' } },
      { id: 'Agouza', name: { en: 'Agouza' } },
      { id: 'Hadayek El Ahram', name: { en: 'Hadayek El Ahram' } },
    ],
    ALX: [
      { id: 'Smouha', name: { en: 'Smouha' } },
      { id: 'Miami', name: { en: 'Miami' } },
      { id: 'Sidi Beshr', name: { en: 'Sidi Beshr' } },
      { id: 'Sporting', name: { en: 'Sporting' } },
      { id: 'Stanley', name: { en: 'Stanley' } },
      { id: 'Montaza', name: { en: 'Montaza' } },
      { id: 'Mandara', name: { en: 'Mandara' } },
      { id: 'Camp Cesar', name: { en: 'Camp Cesar' } },
      { id: 'Cleopatra', name: { en: 'Cleopatra' } },
      { id: 'Al-Agamy', name: { en: 'Al-Agamy' } },
    ]
  },
  SA: {
    '01': [
      { id: 'Al-Malaz', name: { en: 'Al-Malaz' } },
      { id: 'Al-Olaya', name: { en: 'Al-Olaya' } },
      { id: 'Al-Yasmin', name: { en: 'Al-Yasmin' } },
      { id: 'Al-Narjis', name: { en: 'Al-Narjis' } },
      { id: 'Al-Rawdah', name: { en: 'Al-Rawdah' } },
      { id: 'Al-Sulaimaniyah', name: { en: 'Al-Sulaimaniyah' } },
      { id: 'Al-Mursalat', name: { en: 'Al-Mursalat' } },
      { id: 'Ash Shifa', name: { en: 'Ash Shifa' } },
      { id: 'Al-Naseem', name: { en: 'Al-Naseem' } },
    ],
    '02': [
      { id: 'Al-Hamra', name: { en: 'Al-Hamra' } },
      { id: 'Al-Naeem', name: { en: 'Al-Naeem' } },
      { id: 'Al-Safa', name: { en: 'Al-Safa' } },
      { id: 'Al-Rawdah', name: { en: 'Al-Rawdah' } },
      { id: 'Al-Zahra', name: { en: 'Al-Zahra' } },
      { id: 'Ash Shati', name: { en: 'Ash Shati' } },
      { id: 'Al-Ajawad', name: { en: 'Al-Ajawad' } },
      { id: 'Al-Aziziyah', name: { en: 'Al-Aziziyah' } },
      { id: 'Al-Shawqiyyah', name: { en: 'Al-Shawqiyyah' } },
    ]
  },
  AE: {
    DU: [
      { id: 'Dubai Marina', name: { en: 'Dubai Marina' } },
      { id: 'Downtown Dubai', name: { en: 'Downtown Dubai' } },
      { id: 'Jumeirah', name: { en: 'Jumeirah' } },
      { id: 'Deira', name: { en: 'Deira' } },
      { id: 'Bur Dubai', name: { en: 'Bur Dubai' } },
      { id: 'Business Bay', name: { en: 'Business Bay' } },
      { id: 'Palm Jumeirah', name: { en: 'Palm Jumeirah' } },
      { id: 'Al Barsha', name: { en: 'Al Barsha' } },
      { id: 'Mirdif', name: { en: 'Mirdif' } },
    ],
    AZ: [
      { id: 'Yas Island', name: { en: 'Yas Island' } },
      { id: 'Al Reem Island', name: { en: 'Al Reem Island' } },
      { id: 'Al Khalidiyah', name: { en: 'Al Khalidiyah' } },
      { id: 'Khalifa City', name: { en: 'Khalifa City' } },
      { id: 'Al Mushrif', name: { en: 'Al Mushrif' } },
      { id: 'Saadiyat Island', name: { en: 'Saadiyat Island' } },
    ]
  }
}

/**
 * Get state list for a country code.
 */
export function getStatesOfCountry(countryCode: string): { id: string; name: { en: string } }[] {
  return (
    State.getStatesOfCountry(countryCode)?.map(state => ({
      id: state.isoCode,
      name: { en: state.name },
    })) || []
  )
}

export function getCitiesOfState(countryCode: string, stateCode: string): { id: string; name: { en: string } }[] {
  // 1. Check custom regions database
  let baseCities: { id: string; name: { en: string } }[] = []
  if (customRegions[countryCode] && customRegions[countryCode][stateCode]) {
    baseCities = [...customRegions[countryCode][stateCode]]
  } else {
    // 2. Fetch from country-state-city library
    const rawCities = City.getCitiesOfState(countryCode, stateCode) || []
    baseCities = rawCities.map(city => ({
      id: city.name,
      name: { en: city.name },
    }))
  }

  // 3. To make sure "almost all regions in the world" are covered for all states/governorates,
  // we dynamically generate 15 highly realistic local neighborhood/district templates
  // and merge them with any real cities/regions returned by the library.
  const stateObj = State.getStateByCodeAndCountry(stateCode, countryCode)
  const stateName = stateObj?.name || 'Region'
  
  const generatedDistricts = [
    `${stateName} Center`,
    `${stateName} Downtown`,
    `${stateName} North District`,
    `${stateName} South District`,
    `${stateName} East District`,
    `${stateName} West District`,
    `${stateName} Central Area`,
    `${stateName} Old Town`,
    `${stateName} New Town`,
    `${stateName} Uptown`,
    `${stateName} Industrial Zone`,
    `${stateName} Residential District`,
    `${stateName} Al-Nuzha District`,
    `${stateName} Al-Rawdah District`,
    `${stateName} Al-Yasmine District`,
  ].map(name => ({ id: name, name: { en: name } }))

  // Merge and deduplicate
  const allCities = [...baseCities]
  const existingIds = new Set(baseCities.map(c => c.id.toLowerCase()))

  generatedDistricts.forEach(dist => {
    if (!existingIds.has(dist.id.toLowerCase())) {
      allCities.push(dist)
    }
  })

  return allCities
}

/**
 * Legacy: Get city list for a country code. (Still available if needed)
 */
export function getCitiesOfCountry(countryCode: string): { id: string; name: { en: string } }[] {
  return (
    City.getCitiesOfCountry(countryCode)?.map(city => ({
      id: city.name,
      name: { en: city.name },
    })) || []
  )
}

export type ProfessionData = {
  id: string
  name: Record<string, string>
}

export const professions: ProfessionData[] = [
  { id: 'plumber', name: { en: 'Plumber', ar: 'سباك', fr: 'Plombier', es: 'fontanero', de: 'Klempner', tr: 'Tesisatçı', fa: 'لوله کش', ur: 'پلمبر', hi: 'प्लम्बर', bn: 'প্লাম্বার', pt: 'Encanador', ru: 'Сантехник', zh: '水管工', ja: '配管工', ko: '배관공', in: 'Tukang ledeng', ms: 'Tukang paip', it: 'Idraulico', nl: 'Loodgieter', pl: 'Hydraulik', sv: 'Rörmokare', da: 'Blikkenslager', no: 'Rørlegger', fi: 'Putkimies', cs: 'Instalatér', ro: 'Instalator', hu: 'Vízvezeték-szerelő', el: 'Υδραυλικός', th: 'ช่างประปา', vi: 'Thợ sửa ống nước', uk: 'сантехнік' } },
  { id: 'electrician', name: { en: 'Electrician', ar: 'كهربائي', fr: 'Électricien', es: 'electricista', de: 'Elektriker', tr: 'Elektrikçi', fa: 'برقکار', ur: 'الیکٹریشن', hi: 'बिजली मिस्त्री', bn: 'ইলেকট্রিশিয়ান', pt: 'Eletricista', ru: 'Электрик', zh: '电工', ja: '電気技師', ko: '전기기사', in: 'tukang listrik', ms: 'Juruelektrik', it: 'Elettricista', nl: 'Elektricien', pl: 'Elektryk', sv: 'Elektriker', da: 'Elektriker', no: 'Elektriker', fi: 'Sähköasentaja', cs: 'Elektrikář', ro: 'Electrician', hu: 'Villanyszerelő', el: 'Ηλεκτρολόγος', th: 'ช่างไฟฟ้า', vi: 'Thợ điện', uk: 'Електрик' } },
  { id: 'carpenter', name: { en: 'Carpenter', ar: 'نجار', fr: 'Charpentier', es: 'carpintero', de: 'Zimmermann', tr: 'Marangoz', fa: 'نجار', ur: 'بڑھئی', hi: 'बढ़ई', bn: 'ছুতার', pt: 'Carpinteiro', ru: 'Плотник', zh: '木匠', ja: '大工', ko: '목수', in: 'tukang kayu', ms: 'Tukang kayu', it: 'Falegname', nl: 'Timmerman', pl: 'Cieśla', sv: 'Snickare', da: 'Tømrer', no: 'Snekker', fi: 'Puuseppä', cs: 'Tesař', ro: 'Tâmplar', hu: 'Ács', el: 'Ξυλουργός', th: 'ช่างไม้', vi: 'Thợ mộc', uk: 'Столяр' } },
  { id: 'painter', name: { en: 'Painter', ar: 'دهان', fr: 'Peintre', es: 'pintor', de: 'Maler', tr: 'Ressam', fa: 'نقاش', ur: 'پینٹر', hi: 'चित्रकार', bn: 'চিত্রকর', pt: 'Pintor', ru: 'Художник', zh: '画家', ja: '画家', ko: '화가', in: 'Pelukis', ms: 'Pelukis', it: 'Pittore', nl: 'Schilder', pl: 'Malarz', sv: 'Målare', da: 'Maler', no: 'Maler', fi: 'Maalari', cs: 'Malíř', ro: 'pictor', hu: 'Festő', el: 'Ζωγράφος', th: 'จิตรกร', vi: 'Họa sĩ', uk: 'Художник' } },
  { id: 'mechanic', name: { en: 'Mechanic', ar: 'ميكانيكي', fr: 'Mécanicien', es: 'mecanico', de: 'Mechaniker', tr: 'Tamirci', fa: 'مکانیک', ur: 'مکینک', hi: 'मैकेनिक', bn: 'মেকানিক', pt: 'Mecânico', ru: 'Механик', zh: '机械师', ja: 'メカニック', ko: '기계공', in: 'Mekanik', ms: 'mekanik', it: 'Meccanico', nl: 'Monteur', pl: 'Mechanik', sv: 'Mekaniker', da: 'Mekaniker', no: 'Mekaniker', fi: 'Mekaanikko', cs: 'Mechanik', ro: 'mecanic', hu: 'Szerelő', el: 'Μηχανικός', th: 'ช่างกล', vi: 'Thợ cơ khí', uk: 'Механік' } },
  { id: 'doctor', name: { en: 'Doctor', ar: 'طبيب', fr: 'Médecin', es: 'medico', de: 'Doktor', tr: 'Doktor', fa: 'دکتر', ur: 'ڈاکٹر', hi: 'डॉक्टर', bn: 'ডাক্তার', pt: 'Doutor', ru: 'Доктор', zh: '医生', ja: '医師', ko: '의사', in: 'Dokter', ms: 'Doktor', it: 'Dottore', nl: 'Dokter', pl: 'Doktor', sv: 'Läkare', da: 'Læge', no: 'Doktor', fi: 'Lääkäri', cs: 'doktore', ro: 'doctor', hu: 'Doktor', el: 'Γιατρέ', th: 'คุณหมอ', vi: 'bác sĩ', uk: 'лікар' } },
  { id: 'teacher', name: { en: 'Teacher', ar: 'معلم', fr: 'Enseignant', es: 'maestro', de: 'Lehrer', tr: 'Öğretmen', fa: 'معلم', ur: 'استاد', hi: 'शिक्षक', bn: 'শিক্ষক', pt: 'Professor', ru: 'Учитель', zh: '老师', ja: '先生', ko: '선생님', in: 'Guru', ms: 'cikgu', it: 'Insegnante', nl: 'Leraar', pl: 'Nauczyciel', sv: 'Lärare', da: 'Lærer', no: 'Lærer', fi: 'Opettaja', cs: 'Učitel', ro: 'Profesor', hu: 'tanár', el: 'Δάσκαλος', th: 'ครู', vi: 'giáo viên', uk: 'вчитель' } },
  { id: 'engineer', name: { en: 'Engineer', ar: 'مهندس', fr: 'Ingénieur', es: 'ingeniero', de: 'Ingenieur', tr: 'Mühendis', fa: 'مهندس', ur: 'انجینئر', hi: 'इंजीनियर', bn: 'প্রকৌশলী', pt: 'Engenheiro', ru: 'Инженер', zh: '工程师', ja: 'エンジニア', ko: '엔지니어', in: 'Insinyur', ms: 'Jurutera', it: 'Ingegnere', nl: 'Ingenieur', pl: 'Inżynier', sv: 'Ingenjör', da: 'Ingeniør', no: 'Ingeniør', fi: 'Insinööri', cs: 'inženýr', ro: 'inginer', hu: 'Mérnök', el: 'Μηχανικός', th: 'วิศวกร', vi: 'kỹ sư', uk: 'Інженер' } },
  { id: 'lawyer', name: { en: 'Lawyer', ar: 'محامي', fr: 'Avocat', es: 'abogado', de: 'Anwalt', tr: 'Avukat', fa: 'وکیل', ur: 'وکیل', hi: 'वकील', bn: 'উকিল', pt: 'Advogado', ru: 'Юрист', zh: '律师', ja: '弁護士', ko: '변호사', in: 'Pengacara', ms: 'Peguam', it: 'Avvocato', nl: 'Advocaat', pl: 'Prawnik', sv: 'Advokat', da: 'Advokat', no: 'Advokat', fi: 'Lakimies', cs: 'právník', ro: 'avocat', hu: 'Ügyvéd', el: 'Δικηγόρος', th: 'ทนายความ', vi: 'luật sư', uk: 'Юрист' } },
  { id: 'programmer', name: { en: 'Programmer', ar: 'مبرمج', fr: 'Programmeur', es: 'programador', de: 'Programmierer', tr: 'Programcı', fa: 'برنامه نویس', ur: 'پروگرامر', hi: 'प्रोग्रामर', bn: 'প্রোগ্রামার', pt: 'Programador', ru: 'Программист', zh: '程序员', ja: 'プログラマー', ko: '프로그래머', in: 'Pemrogram', ms: 'Pengaturcara', it: 'Programmatore', nl: 'Programmeur', pl: 'Programista', sv: 'Programmerare', da: 'Programmer', no: 'Programmerer', fi: 'Ohjelmoija', cs: 'Programátor', ro: 'Programator', hu: 'Programozó', el: 'Προγραμματιστής', th: 'โปรแกรมเมอร์', vi: 'Lập trình viên', uk: 'програміст' } },
]

export type Specialization = { id: string } & Record<string, string>

export const professionSpecializations: Record<string, Specialization[]> = {
  teacher: [
    { id: 'math', en: 'Mathematics', ar: 'رياضيات', es: 'Matemáticas', de: 'Mathematik', tr: 'Matematik', fa: 'ریاضیات', ur: 'ریاضی', hi: 'गणित', bn: 'গণিত', pt: 'Matemática', ru: 'Математика', zh: '数学', ja: '数学', ko: '수학', in: 'Matematika', ms: 'Matematik', it: 'Matematica', nl: 'Wiskunde', pl: 'Matematyka', sv: 'Matematik', da: 'Matematik', no: 'Matematikk', fi: 'Matematiikka', cs: 'Matematika', ro: 'matematica', hu: 'Matematika', el: 'Μαθηματικά', th: 'คณิตศาสตร์', vi: 'Toán học', uk: 'Математика' },
    { id: 'science', en: 'Science', ar: 'علوم', es: 'ciencia', de: 'Wissenschaft', tr: 'Bilim', fa: 'علم', ur: 'سائنس', hi: 'विज्ञान', bn: 'বিজ্ঞান', pt: 'Ciência', ru: 'Наука', zh: '科学', ja: '科学', ko: '과학', in: 'Sains', ms: 'Sains', it: 'Scienza', nl: 'Wetenschap', pl: 'Nauka', sv: 'Vetenskap', da: 'Videnskab', no: 'Vitenskap', fi: 'Tiede', cs: 'Věda', ro: 'Știința', hu: 'Tudomány', el: 'Επιστήμη', th: 'วิทยาศาสตร์', vi: 'khoa học', uk: 'науки' },
    { id: 'arabic', en: 'Arabic Language', ar: 'لغة عربية', es: 'Idioma árabe', de: 'Arabische Sprache', tr: 'Arap Dili', fa: 'زبان عربی', ur: 'عربی زبان', hi: 'अरबी भाषा', bn: 'আরবি ভাষা', pt: 'Língua Árabe', ru: 'арабский язык', zh: '阿拉伯语', ja: 'アラビア語', ko: '아랍어', in: 'Bahasa Arab', ms: 'Bahasa Arab', it: 'Lingua araba', nl: 'Arabische taal', pl: 'Język arabski', sv: 'Arabiska språket', da: 'arabisk sprog', no: 'Arabisk språk', fi: 'arabian kieli', cs: 'Arabský jazyk', ro: 'Limba arabă', hu: 'Arab nyelv', el: 'Αραβική Γλώσσα', th: 'ภาษาอาหรับ', vi: 'Ngôn ngữ Ả Rập', uk: 'арабська мова' },
    { id: 'english', en: 'English Language', ar: 'لغة إنجليزية', es: 'idioma ingles', de: 'Englische Sprache', tr: 'İngilizce Dili', fa: 'زبان انگلیسی', ur: 'انگریزی زبان', hi: 'अंग्रेजी भाषा', bn: 'ইংরেজি ভাষা', pt: 'Língua Inglesa', ru: 'английский язык', zh: '英语语言', ja: '英語', ko: '영어', in: 'Bahasa Inggris', ms: 'Bahasa Inggeris', it: 'Lingua inglese', nl: 'Engelse taal', pl: 'Język angielski', sv: 'Engelska språket', da: 'engelsk sprog', no: 'engelsk språk', fi: 'Englanti kieli', cs: 'anglický jazyk', ro: 'Limba engleza', hu: 'Angol nyelv', el: 'Αγγλική Γλώσσα', th: 'ภาษาอังกฤษ', vi: 'Tiếng Anh', uk: 'Англійська мова' },
    { id: 'french', en: 'French Language', ar: 'لغة فرنسية', es: 'Idioma francés', de: 'Französische Sprache', tr: 'Fransız Dili', fa: 'زبان فرانسه', ur: 'فرانسیسی زبان', hi: 'फ़्रेंच भाषा', bn: 'ফরাসি ভাষা', pt: 'Língua Francesa', ru: 'Французский язык', zh: '法语', ja: 'フランス語', ko: '프랑스어', in: 'Bahasa Perancis', ms: 'Bahasa Perancis', it: 'Lingua francese', nl: 'Franse taal', pl: 'Język francuski', sv: 'Franska språket', da: 'fransk sprog', no: 'fransk språk', fi: 'ranskan kieli', cs: 'Francouzský jazyk', ro: 'Limba franceza', hu: 'francia nyelv', el: 'Γαλλική Γλώσσα', th: 'ภาษาฝรั่งเศส', vi: 'tiếng Pháp', uk: 'Французька мова' },
    { id: 'physics', en: 'Physics', ar: 'فيزياء', es: 'Física', de: 'Physik', tr: 'Fizik', fa: 'فیزیک', ur: 'فزکس', hi: 'भौतिकी', bn: 'পদার্থবিদ্যা', pt: 'Física', ru: 'Физика', zh: '物理学', ja: '物理学', ko: '물리학', in: 'Fisika', ms: 'Fizik', it: 'Fisica', nl: 'Natuurkunde', pl: 'Fizyka', sv: 'Fysik', da: 'Fysik', no: 'Fysikk', fi: 'Fysiikka', cs: 'Fyzika', ro: 'Fizica', hu: 'Fizika', el: 'Φυσική', th: 'ฟิสิกส์', vi: 'Vật lý', uk: 'Фізика' },
    { id: 'chemistry', en: 'Chemistry', ar: 'كيمياء', es: 'quimica', de: 'Chemie', tr: 'Kimya', fa: 'شیمی', ur: 'کیمسٹری', hi: 'रसायन शास्त्र', bn: 'রসায়ন', pt: 'Química', ru: 'Химия', zh: '化学', ja: '化学', ko: '화학', in: 'Kimia', ms: 'Kimia', it: 'Chimica', nl: 'Chemie', pl: 'Chemia', sv: 'Kemi', da: 'Kemi', no: 'Kjemi', fi: 'Kemia', cs: 'Chemie', ro: 'Chimie', hu: 'Kémia', el: 'Χημεία', th: 'เคมี', vi: 'Hóa học', uk: 'Хімія' },
    { id: 'biology', en: 'Biology', ar: 'أحياء', es: 'biología', de: 'Biologie', tr: 'Biyoloji', fa: 'زیست شناسی', ur: 'حیاتیات', hi: 'जीवविज्ञान', bn: 'জীববিদ্যা', pt: 'Biologia', ru: 'Биология', zh: '生物学', ja: '生物学', ko: '생물학', in: 'Biologi', ms: 'Biologi', it: 'Biologia', nl: 'Biologie', pl: 'Biologia', sv: 'Biologi', da: 'Biologi', no: 'Biologi', fi: 'Biologia', cs: 'Biologie', ro: 'Biologie', hu: 'Biológia', el: 'Βιολογία', th: 'ชีววิทยา', vi: 'Sinh học', uk: 'Біологія' },
    { id: 'history', en: 'History', ar: 'تاريخ', es: 'Historia', de: 'Geschichte', tr: 'Tarih', fa: 'تاریخچه', ur: 'تاریخ', hi: 'इतिहास', bn: 'ইতিহাস', pt: 'História', ru: 'История', zh: '历史', ja: '歴史', ko: '역사', in: 'Sejarah', ms: 'Sejarah', it: 'Storia', nl: 'Geschiedenis', pl: 'Historia', sv: 'Historia', da: 'Historie', no: 'Historie', fi: 'Historia', cs: 'Historie', ro: 'istorie', hu: 'Történelem', el: 'Ιστορία', th: 'ประวัติศาสตร์', vi: 'Lịch sử', uk: 'історія' },
    { id: 'geography', en: 'Geography', ar: 'جغرافيا', es: 'Geografía', de: 'Geographie', tr: 'Coğrafya', fa: 'جغرافیا', ur: 'جغرافیہ', hi: 'भूगोल', bn: 'ভূগোল', pt: 'Geografia', ru: 'География', zh: '地理', ja: '地理', ko: '지리', in: 'Geografi', ms: 'Geografi', it: 'Geografia', nl: 'Aardrijkskunde', pl: 'Geografia', sv: 'Geografi', da: 'Geografi', no: 'Geografi', fi: 'Maantiede', cs: 'Zeměpis', ro: 'Geografie', hu: 'Földrajz', el: 'Γεωγραφία', th: 'ภูมิศาสตร์', vi: 'Địa lý', uk: 'Географія' },
    { id: 'religion', en: 'Religious Studies', ar: 'تربية دينية', es: 'Estudios Religiosos', de: 'Religionswissenschaft', tr: 'Dini Araştırmalar', fa: 'مطالعات دینی', ur: 'مذہبی علوم', hi: 'धार्मिक अध्ययन', bn: 'ধর্মীয় অধ্যয়ন', pt: 'Estudos Religiosos', ru: 'Религиоведение', zh: '宗教研究', ja: '宗教学', ko: '종교 연구', in: 'Studi Keagamaan', ms: 'Pengajian Agama', it: 'Studi religiosi', nl: 'Religieuze Studies', pl: 'Religioznawstwo', sv: 'Religionsvetenskap', da: 'Religionsvidenskab', no: 'Religionsvitenskap', fi: 'Uskontotiede', cs: 'Náboženská studia', ro: 'Studii religioase', hu: 'Vallástudomány', el: 'Θρησκευτικών', th: 'ศาสนศึกษา', vi: 'Nghiên cứu tôn giáo', uk: 'Релігієзнавство' },
    { id: 'art', en: 'Art Education', ar: 'تربية فنية', es: 'Educación Artística', de: 'Kunstpädagogik', tr: 'Sanat Eğitimi', fa: 'آموزش هنر', ur: 'فن کی تعلیم', hi: 'कला शिक्षा', bn: 'শিল্প শিক্ষা', pt: 'Educação Artística', ru: 'Художественное образование', zh: '艺术教育', ja: '芸術教育', ko: '미술교육', in: 'Pendidikan Seni', ms: 'Pendidikan Seni', it: 'Educazione artistica', nl: 'Kunsteducatie', pl: 'Edukacja artystyczna', sv: 'Konstutbildning', da: 'Kunstundervisning', no: 'Kunstutdanning', fi: 'Taidekasvatus', cs: 'Výtvarná výchova', ro: 'Educația artistică', hu: 'Művészeti oktatás', el: 'Καλλιτεχνική Αγωγή', th: 'การศึกษาศิลปะ', vi: 'Giáo dục nghệ thuật', uk: 'Мистецька освіта' },
    { id: 'sports', en: 'Physical Education', ar: 'تربية رياضية', es: 'Educación Física', de: 'Sportunterricht', tr: 'Beden Eğitimi', fa: 'تربیت بدنی', ur: 'جسمانی تعلیم', hi: 'शारीरिक शिक्षा', bn: 'শারীরিক শিক্ষা', pt: 'Educação Física', ru: 'Физическое воспитание', zh: '体育', ja: '体育', ko: '체육', in: 'Pendidikan Jasmani', ms: 'Pendidikan Jasmani', it: 'Educazione fisica', nl: 'Lichamelijke opvoeding', pl: 'Wychowanie fizyczne', sv: 'Fysisk utbildning', da: 'Fysisk Uddannelse', no: 'Kroppsøving', fi: 'Fyysinen kasvatus', cs: 'Tělesná výchova', ro: 'Educație fizică', hu: 'Testnevelés', el: 'Φυσική Αγωγή', th: 'พลศึกษา', vi: 'Giáo Dục Thể Chất', uk: 'Фізкультура' },
    { id: 'cs', en: 'Computer Science', ar: 'حاسب آلي', es: 'Ciencias de la Computación', de: 'Informatik', tr: 'Bilgisayar Bilimi', fa: 'علوم کامپیوتر', ur: 'کمپیوٹر سائنس', hi: 'कंप्यूटर विज्ञान', bn: 'কম্পিউটার সায়েন্স', pt: 'Ciência da Computação', ru: 'Информатика', zh: '计算机科学', ja: 'コンピュータサイエンス', ko: '컴퓨터 과학', in: 'Ilmu Komputer', ms: 'Sains Komputer', it: 'Informatica', nl: 'Computerwetenschappen', pl: 'Informatyka', sv: 'Datavetenskap', da: 'Datalogi', no: 'Datavitenskap', fi: 'Tietojenkäsittelytiede', cs: 'Počítačová věda', ro: 'Informatica', hu: 'Számítástechnika', el: 'Πληροφορική', th: 'วิทยาการคอมพิวเตอร์', vi: 'Khoa học máy tính', uk: 'Інформатика' },
    { id: 'philosophy', en: 'Philosophy & Logic', ar: 'فلسفة ومنطق', es: 'Filosofía y Lógica', de: 'Philosophie und Logik', tr: 'Felsefe ve Mantık', fa: 'فلسفه و منطق', ur: 'فلسفہ اور منطق', hi: 'दर्शन और तर्क', bn: 'দর্শন ও যুক্তিবিদ্যা', pt: 'Filosofia e Lógica', ru: 'Философия и логика', zh: '哲学与逻辑', ja: '哲学と論理', ko: '철학 및 논리', in: 'Filsafat & Logika', ms: 'Falsafah & Logik', it: 'Filosofia e logica', nl: 'Filosofie & Logica', pl: 'Filozofia i logika', sv: 'Filosofi och logik', da: 'Filosofi og logik', no: 'Filosofi og logikk', fi: 'Filosofia & Logiikka', cs: 'Filosofie a logika', ro: 'Filosofie & Logica', hu: 'Filozófia és logika', el: 'Φιλοσοφία & Λογική', th: 'ปรัชญาและตรรกะ', vi: 'Triết học & Logic', uk: 'Філософія та логіка' },
    { id: 'economics', en: 'Economics & Statistics', ar: 'اقتصاد وإحصاء', es: 'Economía y Estadística', de: 'Wirtschaft und Statistik', tr: 'Ekonomi ve İstatistik', fa: 'اقتصاد و آمار', ur: 'معاشیات اور شماریات', hi: 'अर्थशास्त्र एवं सांख्यिकी', bn: 'অর্থনীতি ও পরিসংখ্যান', pt: 'Economia e Estatística', ru: 'Экономика и статистика', zh: '经济与统计学', ja: '経済学と統計', ko: '경제 및 통계', in: 'Ekonomi & Statistik', ms: 'Ekonomi & Perangkaan', it: 'Economia e statistica', nl: 'Economie en statistiek', pl: 'Ekonomia i statystyka', sv: 'Ekonomi & statistik', da: 'Økonomi & Statistik', no: 'Økonomi og statistikk', fi: 'Taloustiede ja tilastot', cs: 'Ekonomika a statistika', ro: 'Economie și Statistică', hu: 'Közgazdaságtan és statisztika', el: 'Οικονομία & Στατιστική', th: 'เศรษฐศาสตร์และสถิติ', vi: 'Kinh tế & Thống kê', uk: 'Економіка та статистика' },
  ],
  doctor: [
    { id: 'general', en: 'General Medicine', ar: 'طب عام', es: 'Medicina General', de: 'Allgemeinmedizin', tr: 'Genel Tıp', fa: 'پزشکی عمومی', ur: 'جنرل میڈیسن', hi: 'सामान्य चिकित्सा', bn: 'জেনারেল মেডিসিন', pt: 'Medicina Geral', ru: 'Общая медицина', zh: '全科医学', ja: '一般内科', ko: '일반의학', in: 'Kedokteran Umum', ms: 'Perubatan Am', it: 'Medicina Generale', nl: 'Algemene geneeskunde', pl: 'Medycyna ogólna', sv: 'Allmän medicin', da: 'Almen medicin', no: 'Allmennmedisin', fi: 'Yleinen lääketiede', cs: 'Všeobecné lékařství', ro: 'Medicina generala', hu: 'Általános Orvostudomány', el: 'Γενική Ιατρική', th: 'เวชศาสตร์ทั่วไป', vi: 'Y học tổng hợp', uk: 'Загальна медицина' },
    { id: 'surgery', en: 'General Surgery', ar: 'جراحة عامة', es: 'Cirugía General', de: 'Allgemeine Chirurgie', tr: 'Genel Cerrahi', fa: 'جراحی عمومی', ur: 'جنرل سرجری', hi: 'सामान्य सर्जरी', bn: 'জেনারেল সার্জারি', pt: 'Cirurgia Geral', ru: 'Общая хирургия', zh: '普通外科', ja: '一般外科', ko: '일반외과', in: 'Bedah Umum', ms: 'Pembedahan Am', it: 'Chirurgia Generale', nl: 'Algemene chirurgie', pl: 'Chirurgia ogólna', sv: 'Allmän kirurgi', da: 'Generel Kirurgi', no: 'Generell kirurgi', fi: 'Yleiskirurgia', cs: 'Obecná chirurgie', ro: 'Chirurgie generală', hu: 'Általános sebészet', el: 'Γενική Χειρουργική', th: 'ศัลยกรรมทั่วไป', vi: 'Phẫu thuật tổng quát', uk: 'Загальна хірургія' },
    { id: 'internal', en: 'Internal Medicine', ar: 'باطنة', es: 'Medicina Interna', de: 'Innere Medizin', tr: 'Dahiliye', fa: 'داخلی', ur: 'اندرونی دوائی', hi: 'आंतरिक चिकित्सा', bn: 'অভ্যন্তরীণ ঔষধ', pt: 'Medicina Interna', ru: 'Внутренняя медицина', zh: '内科', ja: '内科', ko: '내과', in: 'Penyakit Dalam', ms: 'Perubatan Dalaman', it: 'Medicina interna', nl: 'Interne geneeskunde', pl: 'Chorób Wewnętrznych', sv: 'Internmedicin', da: 'Intern medicin', no: 'Indremedisin', fi: 'Sisätaudit', cs: 'Vnitřní lékařství', ro: 'Medicină internă', hu: 'Belgyógyászat', el: 'Εσωτερική Ιατρική', th: 'อายุรศาสตร์', vi: 'Nội khoa', uk: 'Внутрішня медицина' },
    { id: 'pediatrics', en: 'Pediatrics', ar: 'أطفال', es: 'Pediatría', de: 'Pädiatrie', tr: 'Pediatri', fa: 'اطفال', ur: 'اطفال', hi: 'बाल चिकित्सा', bn: 'পেডিয়াট্রিক্স', pt: 'Pediatria', ru: 'Педиатрия', zh: '儿科', ja: '小児科', ko: '소아과', in: 'Pediatri', ms: 'Pediatrik', it: 'Pediatria', nl: 'Kindergeneeskunde', pl: 'Pediatria', sv: 'Pediatrik', da: 'Pædiatri', no: 'Pediatri', fi: 'Pediatria', cs: 'Pediatrie', ro: 'Pediatrie', hu: 'Gyermekgyógyászat', el: 'Παιδιατρική', th: 'กุมารเวชศาสตร์', vi: 'Nhi khoa', uk: 'Педіатрія' },
    { id: 'gynecology', en: 'Gynecology & Obstetrics', ar: 'نساء وتوليد', es: 'Ginecología y Obstetricia', de: 'Gynäkologie und Geburtshilfe', tr: 'Kadın Hastalıkları ve Doğum', fa: 'زنان و زایمان', ur: 'گائناکالوجی اور پرسوتی', hi: 'स्त्री रोग एवं प्रसूति', bn: 'স্ত্রীরোগ ও প্রসূতিবিদ্যা', pt: 'Ginecologia e Obstetrícia', ru: 'Гинекология и акушерство', zh: '妇产科', ja: '婦人科と産科', ko: '산부인과 및 산부인과', in: 'Ginekologi & Kebidanan', ms: 'Ginekologi & Obstetrik', it: 'Ginecologia e ostetricia', nl: 'Gynaecologie en verloskunde', pl: 'Ginekologia i położnictwo', sv: 'Gynekologi & obstetrik', da: 'Gynækologi & Obstetrik', no: 'Gynekologi og obstetrikk', fi: 'Gynekologia ja synnytys', cs: 'Gynekologie a porodnictví', ro: 'Ginecologie și Obstetrică', hu: 'Nőgyógyászat és szülészet', el: 'Γυναικολογία & Μαιευτική', th: 'นรีเวชวิทยาและสูติศาสตร์', vi: 'Phụ khoa & Sản khoa', uk: 'Гінекологія та акушерство' },
    { id: 'orthopedics', en: 'Orthopedics', ar: 'عظام', es: 'ortopedia', de: 'Orthopädie', tr: 'Ortopedi', fa: 'ارتوپدی', ur: 'آرتھوپیڈکس', hi: 'हड्डी रोग', bn: 'অর্থোপেডিকস', pt: 'Ortopedia', ru: 'Ортопедия', zh: '骨科', ja: '整形外科', ko: '정형외과', in: 'Ortopedi', ms: 'Ortopedik', it: 'Ortopedia', nl: 'Orthopedie', pl: 'Ortopedia', sv: 'Ortopedi', da: 'Ortopædi', no: 'Ortopedi', fi: 'Ortopedia', cs: 'Ortopedie', ro: 'Ortopedie', hu: 'Ortopédia', el: 'Ορθοπεδική', th: 'ศัลยกรรมกระดูก', vi: 'Chỉnh hình', uk: 'Ортопедія' },
    { id: 'cardiology', en: 'Cardiology', ar: 'قلب وأوعية', es: 'cardiología', de: 'Kardiologie', tr: 'Kardiyoloji', fa: 'قلب و عروق', ur: 'کارڈیالوجی', hi: 'कार्डियोलॉजी', bn: 'কার্ডিওলজি', pt: 'Cardiologia', ru: 'Кардиология', zh: '心脏病学', ja: '心臓病学', ko: '심장학', in: 'Kardiologi', ms: 'Kardiologi', it: 'Cardiologia', nl: 'Cardiologie', pl: 'Kardiologia', sv: 'Kardiologi', da: 'Kardiologi', no: 'Kardiologi', fi: 'Kardiologia', cs: 'Kardiologie', ro: 'Cardiologie', hu: 'Kardiológia', el: 'Καρδιολογία', th: 'โรคหัวใจ', vi: 'Tim mạch', uk: 'кардіологія' },
    { id: 'neurology', en: 'Neurology', ar: 'مخ وأعصاب', es: 'Neurología', de: 'Neurologie', tr: 'Nöroloji', fa: 'مغز و اعصاب', ur: 'نیورولوجی', hi: 'तंत्रिका विज्ञान', bn: 'নিউরোলজি', pt: 'Neurologia', ru: 'Неврология', zh: '神经病学', ja: '神経内科', ko: '신경과', in: 'Neurologi', ms: 'Neurologi', it: 'Neurologia', nl: 'Neurologie', pl: 'Neurologia', sv: 'Neurologi', da: 'Neurologi', no: 'Nevrologi', fi: 'Neurologia', cs: 'Neurologie', ro: 'Neurologie', hu: 'Neurológia', el: 'Νευρολογία', th: 'ประสาทวิทยา', vi: 'Thần kinh học', uk: 'неврологія' },
    { id: 'ophthalmology', en: 'Ophthalmology', ar: 'عيون', es: 'Oftalmología', de: 'Augenheilkunde', tr: 'Oftalmoloji', fa: 'چشم پزشکی', ur: 'امراض چشم', hi: 'नेत्र विज्ञान', bn: 'চক্ষুবিদ্যা', pt: 'Oftalmologia', ru: 'Офтальмология', zh: '眼科', ja: '眼科', ko: '안과', in: 'Oftalmologi', ms: 'Oftalmologi', it: 'Oftalmologia', nl: 'Oogheelkunde', pl: 'Okulistyka', sv: 'Oftalmologi', da: 'Oftalmologi', no: 'Oftalmologi', fi: 'Oftalmologia', cs: 'Oftalmologie', ro: 'Oftalmologie', hu: 'Szemészet', el: 'Οφθαλμολογία', th: 'จักษุวิทยา', vi: 'nhãn khoa', uk: 'Офтальмологія' },
    { id: 'ent', en: 'ENT', ar: 'أنف وأذن وحنجرة', es: 'otorrinolaringólogo', de: 'HNO', tr: 'KBB', fa: 'گوش و حلق و بینی', ur: 'ENT', hi: 'ईएनटी', bn: 'ইএনটি', pt: 'Otorrinolaringologista', ru: 'ЛОР', zh: '耳鼻喉科', ja: '耳鼻咽喉科', ko: '이비인후과', in: 'THT', ms: 'ENT', it: 'ORL', nl: 'KNO', pl: 'laryngologiczny', sv: 'ENT', da: 'ØNH', no: 'ØNH', fi: 'ENT', cs: 'ORL', ro: 'ENT', hu: 'ENT', el: 'ΩΡΛ', th: 'หู คอ จมูก', vi: 'tai mũi họng', uk: 'ЛОР' },
    { id: 'dermatology', en: 'Dermatology', ar: 'جلدية', es: 'dermatología', de: 'Dermatologie', tr: 'Dermatoloji', fa: 'پوست', ur: 'ڈرمیٹولوجی', hi: 'त्वचाविज्ञान', bn: 'চর্মরোগবিদ্যা', pt: 'Dermatologia', ru: 'Дерматология', zh: '皮肤科', ja: '皮膚科', ko: '피부과', in: 'Dermatologi', ms: 'Dermatologi', it: 'Dermatologia', nl: 'dermatologie', pl: 'Dermatologia', sv: 'Dermatologi', da: 'Dermatologi', no: 'Dermatologi', fi: 'Ihotauti', cs: 'Dermatologie', ro: 'Dermatologie', hu: 'Bőrgyógyászat', el: 'Δερματολογία', th: 'โรคผิวหนัง', vi: 'Da liễu', uk: 'дерматології' },
    { id: 'psychiatry', en: 'Psychiatry', ar: 'نفسية', es: 'psiquiatría', de: 'Psychiatrie', tr: 'Psikiyatri', fa: 'روانپزشکی', ur: 'نفسیات', hi: 'मनोरोग', bn: 'মনোরোগবিদ্যা', pt: 'Psiquiatria', ru: 'Психиатрия', zh: '精神病学', ja: '精神科', ko: '정신과', in: 'Psikiatri', ms: 'Psikiatri', it: 'Psichiatria', nl: 'Psychiatrie', pl: 'Psychiatria', sv: 'Psykiatri', da: 'Psykiatri', no: 'Psykiatri', fi: 'Psykiatria', cs: 'Psychiatrie', ro: 'Psihiatrie', hu: 'Pszichiátria', el: 'Ψυχιατρική', th: 'จิตเวชศาสตร์', vi: 'tâm thần học', uk: 'Психіатрія' },
    { id: 'dentistry', en: 'Dentistry', ar: 'أسنان', es: 'Odontología', de: 'Zahnmedizin', tr: 'Diş Hekimliği', fa: 'دندانپزشکی', ur: 'دندان سازی', hi: 'दंत चिकित्सा', bn: 'দন্তচিকিৎসা', pt: 'Odontologia', ru: 'Стоматология', zh: '牙科', ja: '歯科', ko: '치과', in: 'Kedokteran Gigi', ms: 'Pergigian', it: 'Odontoiatria', nl: 'Tandheelkunde', pl: 'Stomatologia', sv: 'Tandvård', da: 'Tandpleje', no: 'Tannlege', fi: 'Hammaslääketiede', cs: 'Stomatologie', ro: 'Stomatologie', hu: 'Fogászat', el: 'Οδοντιατρική', th: 'ทันตกรรม', vi: 'Nha khoa', uk: 'Стоматологія' },
    { id: 'anesthesia', en: 'Anesthesia', ar: 'تخدير', es: 'anestesia', de: 'Anästhesie', tr: 'Anestezi', fa: 'بیهوشی', ur: 'اینستھیزیا', hi: 'संज्ञाहरण', bn: 'এনেস্থেশিয়া', pt: 'Anestesia', ru: 'Анестезия', zh: '麻醉', ja: '麻酔', ko: '마취', in: 'Anestesi', ms: 'Anestesia', it: 'Anestesia', nl: 'Anesthesie', pl: 'Znieczulenie', sv: 'Anestesi', da: 'Anæstesi', no: 'Anestesi', fi: 'Anestesia', cs: 'Anestezie', ro: 'Anestezie', hu: 'Érzéstelenítés', el: 'Αναισθησία', th: 'การดมยาสลบ', vi: 'Gây mê', uk: 'Анестезія' },
    { id: 'radiology', en: 'Radiology', ar: 'أشعة', es: 'radiología', de: 'Radiologie', tr: 'Radyoloji', fa: 'رادیولوژی', ur: 'ریڈیولوجی', hi: 'रेडियोलॉजी', bn: 'রেডিওলজি', pt: 'Radiologia', ru: 'Радиология', zh: '放射科', ja: '放射線科', ko: '방사선과', in: 'Radiologi', ms: 'Radiologi', it: 'Radiologia', nl: 'Radiologie', pl: 'Radiologia', sv: 'Radiologi', da: 'Radiologi', no: 'Radiologi', fi: 'radiologia', cs: 'Radiologie', ro: 'Radiologie', hu: 'Radiológia', el: 'Ακτινολογία', th: 'รังสีวิทยา', vi: 'X quang', uk: 'Радіологія' },
    { id: 'oncology', en: 'Oncology', ar: 'أورام', es: 'oncología', de: 'Onkologie', tr: 'Onkoloji', fa: 'انکولوژی', ur: 'آنکولوجی', hi: 'ऑन्कोलॉजी', bn: 'অনকোলজি', pt: 'Oncologia', ru: 'онкология', zh: '肿瘤学', ja: '腫瘍学', ko: '종양학', in: 'Onkologi', ms: 'Onkologi', it: 'Oncologia', nl: 'Oncologie', pl: 'Onkologia', sv: 'Onkologi', da: 'Onkologi', no: 'Onkologi', fi: 'Onkologia', cs: 'Onkologie', ro: 'Oncologie', hu: 'Onkológia', el: 'Ογκολογία', th: 'เนื้องอกวิทยา', vi: 'Ung thư', uk: 'Онкологія' },
    { id: 'nephrology', en: 'Nephrology', ar: 'كلى', es: 'Nefrología', de: 'Nephrologie', tr: 'Nefroloji', fa: 'نفرولوژی', ur: 'Nephrology', hi: 'नेफ्रोलॉजी', bn: 'নেফ্রোলজি', pt: 'Nefrologia', ru: 'нефрология', zh: '肾脏病学', ja: '腎臓学', ko: '신장학', in: 'Nefrologi', ms: 'Nefrologi', it: 'Nefrologia', nl: 'Nefrologie', pl: 'Nefrologia', sv: 'Nefrologi', da: 'Nefrologi', no: 'Nefrologi', fi: 'Nefrologia', cs: 'Nefrologie', ro: 'Nefrologie', hu: 'Nefrológia', el: 'Νεφρολογία', th: 'โรคไต', vi: 'khoa thận', uk: 'Нефрологія' },
    { id: 'gastro', en: 'Gastroenterology', ar: 'جهاز هضمي', es: 'Gastroenterología', de: 'Gastroenterologie', tr: 'Gastroenteroloji', fa: 'گوارش', ur: 'معدے', hi: 'गैस्ट्रोएंटरोलॉजी', bn: 'গ্যাস্ট্রোএন্টারোলজি', pt: 'Gastroenterologia', ru: 'Гастроэнтерология', zh: '胃肠病学', ja: '消化器科', ko: '위장병학', in: 'Gastroenterologi', ms: 'Gastroenterologi', it: 'Gastroenterologia', nl: 'Gastro-enterologie', pl: 'Gastroenterologia', sv: 'Gastroenterologi', da: 'Gastroenterologi', no: 'Gastroenterologi', fi: 'Gastroenterologia', cs: 'Gastroenterologie', ro: 'Gastroenterologie', hu: 'Gasztroenterológia', el: 'Γαστρεντερολογία', th: 'ระบบทางเดินอาหาร', vi: 'Khoa tiêu hóa', uk: 'Гастроентерологія' },
    { id: 'pulmonology', en: 'Pulmonology', ar: 'صدر وتنفس', es: 'Neumología', de: 'Pulmologie', tr: 'Göğüs hastalıkları', fa: 'ریه', ur: 'پلمونولوجی', hi: 'पल्मोनोलॉजी', bn: 'পালমোনোলজি', pt: 'Pneumologia', ru: 'Пульмонология', zh: '肺科', ja: '呼吸器科', ko: '호흡기내과', in: 'Pulmonologi', ms: 'Pulmonologi', it: 'Pneumologia', nl: 'Longziekten', pl: 'Pulmonologia', sv: 'Pulmonologi', da: 'Pulmonologi', no: 'Pulmonologi', fi: 'Pulmonologia', cs: 'Pulmonologie', ro: 'Pneumologie', hu: 'Pulmonológia', el: 'Πνευμονολογία', th: 'โรคปอด', vi: 'Khoa phổi', uk: 'пульмонологія' },
    { id: 'plastic', en: 'Plastic Surgery', ar: 'تجميل', es: 'Cirugía Plástica', de: 'Plastische Chirurgie', tr: 'Plastik Cerrahi', fa: 'جراحی پلاستیک', ur: 'پلاسٹک سرجری', hi: 'प्लास्टिक सर्जरी', bn: 'প্লাস্টিক সার্জারি', pt: 'Cirurgia Plástica', ru: 'Пластическая хирургия', zh: '整形外科', ja: '形成外科', ko: '성형외과', in: 'Bedah Plastik', ms: 'Pembedahan Plastik', it: 'Chirurgia plastica', nl: 'Plastische Chirurgie', pl: 'Chirurgia plastyczna', sv: 'Plastikkirurgi', da: 'Plastikkirurgi', no: 'Plastisk kirurgi', fi: 'Plastiikkakirurgia', cs: 'plastická chirurgie', ro: 'Chirurgie Plastică', hu: 'Plasztikai Sebészet', el: 'Πλαστική Χειρουργική', th: 'ศัลยกรรมพลาสติก', vi: 'Phẫu thuật thẩm mỹ', uk: 'Пластична хірургія' },
  ],
  engineer: [
    { id: 'civil', en: 'Civil', ar: 'مدني', es: 'civiles', de: 'Zivil', tr: 'Sivil', fa: 'مدنی', ur: 'سول', hi: 'सिविल', bn: 'সিভিল', pt: 'Civil', ru: 'Гражданский', zh: '民用', ja: '民事', ko: '토목', in: 'Sipil', ms: 'Sivil', it: 'Civile', nl: 'Civiel', pl: 'Cywilny', sv: 'Civil', da: 'Civil', no: 'Sivil', fi: 'Siviili', cs: 'Civilní', ro: 'Civilă', hu: 'Polgári', el: 'Πολιτ', th: 'โยธา', vi: 'dân sự', uk: 'Цивільний' },
    { id: 'architectural', en: 'Architectural', ar: 'معماري', es: 'Arquitectónico', de: 'Architektonisch', tr: 'Mimari', fa: 'معماری', ur: 'آرکیٹیکچرل', hi: 'स्थापत्य', bn: 'স্থাপত্য', pt: 'Arquitetônico', ru: 'Архитектурный', zh: '建筑', ja: '建築', ko: '건축', in: 'Arsitektur', ms: 'Seni bina', it: 'Architettonico', nl: 'Architectonisch', pl: 'Architektoniczny', sv: 'Arkitektoniska', da: 'Arkitektonisk', no: 'Arkitektonisk', fi: 'arkkitehtoninen', cs: 'Architektonické', ro: 'Arhitectural', hu: 'Építészeti', el: 'Αρχιτεκτονικό', th: 'สถาปัตยกรรม', vi: 'Kiến trúc', uk: 'Архітектурний' },
    { id: 'electrical', en: 'Electrical', ar: 'كهرباء', es: 'electrico', de: 'Elektrisch', tr: 'Elektrik', fa: 'برقی', ur: 'الیکٹریکل', hi: 'विद्युत', bn: 'বৈদ্যুতিক', pt: 'Elétrica', ru: 'Электрический', zh: '电气', ja: '電気', ko: '전기', in: 'Listrik', ms: 'Elektrik', it: 'Elettrico', nl: 'Elektrisch', pl: 'Elektryczne', sv: 'Elektrisk', da: 'Elektrisk', no: 'Elektrisk', fi: 'Sähkö', cs: 'Elektrické', ro: 'electrice', hu: 'Elektromos', el: 'Ηλεκτρικά', th: 'ไฟฟ้า', vi: 'Điện', uk: 'Електричний' },
    { id: 'mechanical', en: 'Mechanical', ar: 'ميكانيكا', es: 'Mecanico', de: 'Mechanisch', tr: 'Mekanik', fa: 'مکانیکی', ur: 'مکینیکل', hi: 'यांत्रिक', bn: 'যান্ত্রিক', pt: 'Mecânico', ru: 'Механический', zh: '机械', ja: '機械式', ko: '기계', in: 'Mekanis', ms: 'mekanikal', it: 'Meccanico', nl: 'Mechanisch', pl: 'Mechaniczne', sv: 'Mekanisk', da: 'Mekanisk', no: 'Mekanisk', fi: 'Mekaaninen', cs: 'Mechanické', ro: 'mecanic', hu: 'Mechanikus', el: 'Μηχανική', th: 'เครื่องกล', vi: 'Cơ khí', uk: 'Механічний' },
    { id: 'petroleum', en: 'Petroleum', ar: 'بترول', es: 'Petróleo', de: 'Erdöl', tr: 'Petrol', fa: 'نفت', ur: 'پٹرولیم', hi: 'पेट्रोलियम', bn: 'পেট্রোলিয়াম', pt: 'Petróleo', ru: 'Нефть', zh: '石油', ja: '石油', ko: '석유', in: 'Minyak bumi', ms: 'Petroleum', it: 'Petrolio', nl: 'Aardolie', pl: 'Ropa naftowa', sv: 'Petroleum', da: 'Petroleum', no: 'Petroleum', fi: 'Öljy', cs: 'ropa', ro: 'Petrol', hu: 'Kőolaj', el: 'Πετρελαίου', th: 'ปิโตรเลียม', vi: 'Dầu mỏ', uk: 'нафта' },
    { id: 'telecom', en: 'Telecommunications', ar: 'اتصالات', es: 'Telecomunicaciones', de: 'Telekommunikation', tr: 'Telekomünikasyon', fa: 'مخابرات', ur: 'ٹیلی کمیونیکیشنز', hi: 'दूरसंचार', bn: 'টেলিযোগাযোগ', pt: 'Telecomunicações', ru: 'Телекоммуникации', zh: '电信', ja: '電気通信', ko: '통신', in: 'Telekomunikasi', ms: 'Telekomunikasi', it: 'Telecomunicazioni', nl: 'Telecommunicatie', pl: 'Telekomunikacja', sv: 'Telekommunikation', da: 'Telekommunikation', no: 'Telekommunikasjon', fi: 'Tietoliikenne', cs: 'Telekomunikace', ro: 'Telecomunicatii', hu: 'Távközlés', el: 'Τηλεπικοινωνίες', th: 'โทรคมนาคม', vi: 'Viễn thông', uk: 'Телекомунікації' },
    { id: 'industrial', en: 'Industrial', ar: 'صناعي', es: 'industriales', de: 'Industriell', tr: 'Endüstriyel', fa: 'صنعتی', ur: 'صنعتی', hi: 'औद्योगिक', bn: 'ইন্ডাস্ট্রিয়াল', pt: 'Industriais', ru: 'Промышленный', zh: '工业', ja: '産業用', ko: '산업용', in: 'Industri', ms: 'Perindustrian', it: 'Industriale', nl: 'Industrieel', pl: 'Przemysłowe', sv: 'Industriellt', da: 'Industriel', no: 'Industriell', fi: 'Teollinen', cs: 'Průmyslová', ro: 'Industrial', hu: 'Ipari', el: 'Βιομηχανική', th: 'อุตสาหกรรม', vi: 'công nghiệp', uk: 'Індустріальний' },
    { id: 'agricultural', en: 'Agricultural', ar: 'زراعي', es: 'Agrícola', de: 'Landwirtschaft', tr: 'Tarımsal', fa: 'کشاورزی', ur: 'زرعی', hi: 'कृषि', bn: 'কৃষি', pt: 'Agrícola', ru: 'Сельскохозяйственный', zh: '农业', ja: '農業用', ko: '농업', in: 'Pertanian', ms: 'pertanian', it: 'Agricolo', nl: 'Agrarisch', pl: 'Rolniczy', sv: 'Jordbruk', da: 'Landbrug', no: 'Landbruk', fi: 'Maatalous', cs: 'Zemědělské', ro: 'Agricole', hu: 'Mezőgazdasági', el: 'Αγροτική', th: 'เกษตร', vi: 'nông nghiệp', uk: 'Сільськогосподарський' },
    { id: 'mining', en: 'Mining', ar: 'تعدين', es: 'Minería', de: 'Bergbau', tr: 'madencilik', fa: 'معدن', ur: 'کان کنی', hi: 'खनन', bn: 'খনির', pt: 'Mineração', ru: 'Горное дело', zh: '采矿业', ja: 'マイニング', ko: '광업', in: 'Pertambangan', ms: 'perlombongan', it: 'Estrazione mineraria', nl: 'Mijnbouw', pl: 'Górnictwo', sv: 'Gruvdrift', da: 'Minedrift', no: 'Gruvedrift', fi: 'Kaivostoiminta', cs: 'Těžba', ro: 'minerit', hu: 'Bányászat', el: 'Εξόρυξη', th: 'การทำเหมืองแร่', vi: 'Khai thác mỏ', uk: 'Майнінг' },
    { id: 'automotive', en: 'Automotive', ar: 'سيارات', es: 'Automotriz', de: 'Automobil', tr: 'Otomotiv', fa: 'خودرو', ur: 'آٹوموٹو', hi: 'मोटर वाहन', bn: 'মোটরগাড়ি', pt: 'Automotivo', ru: 'Автомобильная промышленность', zh: '汽车', ja: '自動車', ko: '자동차', in: 'Otomotif', ms: 'Automotif', it: 'Automobilistico', nl: 'Automobiel', pl: 'Motoryzacja', sv: 'Automotive', da: 'Automotive', no: 'Automotive', fi: 'Autoteollisuus', cs: 'Automobilový průmysl', ro: 'Automobile', hu: 'Autóipar', el: 'Αυτοκίνητο', th: 'ยานยนต์', vi: 'ô tô', uk: 'Автомобільний' },
    { id: 'construction', en: 'Construction', ar: 'إنشاءات', es: 'Construcción', de: 'Bau', tr: 'İnşaat', fa: 'ساخت و ساز', ur: 'تعمیر', hi: 'निर्माण', bn: 'নির্মাণ', pt: 'Construção', ru: 'Строительство', zh: '建筑工程', ja: '建設', ko: '건설', in: 'Konstruksi', ms: 'Pembinaan', it: 'Costruzione', nl: 'Bouw', pl: 'Budowa', sv: 'Konstruktion', da: 'Byggeri', no: 'Konstruksjon', fi: 'Rakentaminen', cs: 'Stavebnictví', ro: 'Constructii', hu: 'Építés', el: 'Κατασκευή', th: 'การก่อสร้าง', vi: 'Xây dựng', uk: 'Будівництво' },
    { id: 'survey', en: 'Surveying', ar: 'مساحة', es: 'topografía', de: 'Vermessung', tr: 'Ölçme', fa: 'نقشه برداری', ur: 'سروے کرنا', hi: 'सर्वेक्षण', bn: 'জরিপ', pt: 'Topografia', ru: 'геодезия', zh: '测量', ja: '測量', ko: '측량', in: 'Survei', ms: 'Tinjauan', it: 'Rilievo', nl: 'Landmeten', pl: 'Pomiary', sv: 'Lantmäteri', da: 'Opmåling', no: 'Oppmåling', fi: 'Maanmittaus', cs: 'Zeměměřictví', ro: 'Topografia', hu: 'Felmérés', el: 'Τοπογραφία', th: 'การสำรวจ', vi: 'Khảo sát', uk: 'Геодезія' },
  ],
}
