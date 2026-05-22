const fs = require('fs');

const locales = ['es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt', 'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'];

const gLang = { 'zh': 'zh-CN' };

async function translateBatch(texts, targetLang) {
  const tl = gLang[targetLang] || targetLang;
  const combined = texts.join('\n');
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + tl + '&dt=t';
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: 'q=' + encodeURIComponent(combined)
    });
    const data = await res.json();
    let translated = '';
    for (let i = 0; i < data[0].length; i++) {
      if (data[0][i][0]) translated += data[0][i][0];
    }
    return translated.split('\n').map(t => t.trim());
  } catch (err) {
    console.error(`Error translating to ${targetLang}:`, err.message || err);
    return texts;
  }
}

const professions = [
  { id: 'plumber', en: 'Plumber', ar: 'سباك', fr: 'Plombier' },
  { id: 'electrician', en: 'Electrician', ar: 'كهربائي', fr: 'Électricien' },
  { id: 'carpenter', en: 'Carpenter', ar: 'نجار', fr: 'Charpentier' },
  { id: 'painter', en: 'Painter', ar: 'دهان', fr: 'Peintre' },
  { id: 'mechanic', en: 'Mechanic', ar: 'ميكانيكي', fr: 'Mécanicien' },
  { id: 'doctor', en: 'Doctor', ar: 'طبيب', fr: 'Médecin' },
  { id: 'teacher', en: 'Teacher', ar: 'معلم', fr: 'Enseignant' },
  { id: 'engineer', en: 'Engineer', ar: 'مهندس', fr: 'Ingénieur' },
  { id: 'lawyer', en: 'Lawyer', ar: 'محامي', fr: 'Avocat' },
  { id: 'programmer', en: 'Programmer', ar: 'مبرمج', fr: 'Programmeur' },
];

const professionSpecializations = {
  teacher: [
    { id: 'math', ar: 'رياضيات', en: 'Mathematics' },
    { id: 'science', ar: 'علوم', en: 'Science' },
    { id: 'arabic', ar: 'لغة عربية', en: 'Arabic Language' },
    { id: 'english', ar: 'لغة إنجليزية', en: 'English Language' },
    { id: 'french', ar: 'لغة فرنسية', en: 'French Language' },
    { id: 'physics', ar: 'فيزياء', en: 'Physics' },
    { id: 'chemistry', ar: 'كيمياء', en: 'Chemistry' },
    { id: 'biology', ar: 'أحياء', en: 'Biology' },
    { id: 'history', ar: 'تاريخ', en: 'History' },
    { id: 'geography', ar: 'جغرافيا', en: 'Geography' },
    { id: 'religion', ar: 'تربية دينية', en: 'Religious Studies' },
    { id: 'art', ar: 'تربية فنية', en: 'Art Education' },
    { id: 'sports', ar: 'تربية رياضية', en: 'Physical Education' },
    { id: 'cs', ar: 'حاسب آلي', en: 'Computer Science' },
    { id: 'philosophy', ar: 'فلسفة ومنطق', en: 'Philosophy & Logic' },
    { id: 'economics', ar: 'اقتصاد وإحصاء', en: 'Economics & Statistics' },
  ],
  doctor: [
    { id: 'general', ar: 'طب عام', en: 'General Medicine' },
    { id: 'surgery', ar: 'جراحة عامة', en: 'General Surgery' },
    { id: 'internal', ar: 'باطنة', en: 'Internal Medicine' },
    { id: 'pediatrics', ar: 'أطفال', en: 'Pediatrics' },
    { id: 'gynecology', ar: 'نساء وتوليد', en: 'Gynecology & Obstetrics' },
    { id: 'orthopedics', ar: 'عظام', en: 'Orthopedics' },
    { id: 'cardiology', ar: 'قلب وأوعية', en: 'Cardiology' },
    { id: 'neurology', ar: 'مخ وأعصاب', en: 'Neurology' },
    { id: 'ophthalmology', ar: 'عيون', en: 'Ophthalmology' },
    { id: 'ent', ar: 'أنف وأذن وحنجرة', en: 'ENT' },
    { id: 'dermatology', ar: 'جلدية', en: 'Dermatology' },
    { id: 'psychiatry', ar: 'نفسية', en: 'Psychiatry' },
    { id: 'dentistry', ar: 'أسنان', en: 'Dentistry' },
    { id: 'anesthesia', ar: 'تخدير', en: 'Anesthesia' },
    { id: 'radiology', ar: 'أشعة', en: 'Radiology' },
    { id: 'oncology', ar: 'أورام', en: 'Oncology' },
    { id: 'nephrology', ar: 'كلى', en: 'Nephrology' },
    { id: 'gastro', ar: 'جهاز هضمي', en: 'Gastroenterology' },
    { id: 'pulmonology', ar: 'صدر وتنفس', en: 'Pulmonology' },
    { id: 'plastic', ar: 'تجميل', en: 'Plastic Surgery' },
  ],
  engineer: [
    { id: 'civil', ar: 'مدني', en: 'Civil' },
    { id: 'architectural', ar: 'معماري', en: 'Architectural' },
    { id: 'electrical', ar: 'كهرباء', en: 'Electrical' },
    { id: 'mechanical', ar: 'ميكانيكا', en: 'Mechanical' },
    { id: 'petroleum', ar: 'بترول', en: 'Petroleum' },
    { id: 'telecom', ar: 'اتصالات', en: 'Telecommunications' },
    { id: 'industrial', ar: 'صناعي', en: 'Industrial' },
    { id: 'agricultural', ar: 'زراعي', en: 'Agricultural' },
    { id: 'mining', ar: 'تعدين', en: 'Mining' },
    { id: 'automotive', ar: 'سيارات', en: 'Automotive' },
    { id: 'construction', ar: 'إنشاءات', en: 'Construction' },
    { id: 'survey', ar: 'مساحة', en: 'Surveying' },
  ],
};

async function main() {
  const profTexts = professions.map(p => p.en);
  const specTexts = [];
  const specMap = [];
  
  for (const [group, specs] of Object.entries(professionSpecializations)) {
    specs.forEach((s, idx) => {
      specTexts.push(s.en);
      specMap.push({ group, index: idx });
    });
  }

  console.log('Translating professions with User-Agent...');
  const profTranslations = {};
  const specTranslations = {};

  for (const loc of locales) {
    console.log(`Translating to ${loc}...`);
    const pTrans = await translateBatch(profTexts, loc);
    profTranslations[loc] = pTrans;
    await new Promise(r => setTimeout(r, 500));

    const sTrans = await translateBatch(specTexts, loc);
    specTranslations[loc] = sTrans;
    await new Promise(r => setTimeout(r, 500));
  }

  let profStr = `export const professions: ProfessionData[] = [\n`;
  for (let i = 0; i < professions.length; i++) {
    const p = professions[i];
    let nameObjStr = `en: '${p.en.replace(/'/g, "\\'")}', ar: '${p.ar.replace(/'/g, "\\'")}', fr: '${p.fr.replace(/'/g, "\\'")}'`;
    for (const loc of locales) {
      const val = profTranslations[loc][i] || p.en;
      nameObjStr += `, ${loc}: '${val.replace(/'/g, "\\'")}'`;
    }
    profStr += `  { id: '${p.id}', name: { ${nameObjStr} } },\n`;
  }
  profStr += `]\n`;

  let specStr = `export const professionSpecializations: Record<string, Specialization[]> = {\n`;
  for (const [group, specs] of Object.entries(professionSpecializations)) {
    specStr += `  ${group}: [\n`;
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const globalIdx = specMap.findIndex(m => m.group === group && m.index === i);
      let nameObjStr = `id: '${s.id}', en: '${s.en.replace(/'/g, "\\'")}', ar: '${s.ar.replace(/'/g, "\\'")}'`;
      if (s.fr) nameObjStr += `, fr: '${s.fr.replace(/'/g, "\\'")}'`;
      for (const loc of locales) {
        const val = specTranslations[loc][globalIdx] || s.en;
        nameObjStr += `, ${loc}: '${val.replace(/'/g, "\\'")}'`;
      }
      specStr += `    { ${nameObjStr} },\n`;
    }
    specStr += `  ],\n`;
  }
  specStr += `}\n`;

  const locFile = 'src/lib/data/locations.ts';
  let content = fs.readFileSync(locFile, 'utf-8');
  
  const targetStart = `export const professions: ProfessionData[] = [`;
  const targetEnd = `  ],\n}\n`;

  const startIndex = content.indexOf(targetStart);
  const endIndex = content.indexOf(targetEnd) + targetEnd.length;

  if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.slice(0, startIndex) + profStr + '\nexport type Specialization = { id: string } & Record<string, string>\n\n' + specStr;
    fs.writeFileSync(locFile, newContent);
    console.log('Successfully updated locations.ts with all profession translations!');
  } else {
    console.log('Target block not found in locations.ts');
  }
}

main().catch(console.error);
