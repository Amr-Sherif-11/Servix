const fs = require('fs');
const path = require('path');

const locales = ['es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt', 'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'];

// Mapping next-intl locales to google translate locales
const gLang = {
  'zh': 'zh-CN'
};

async function translateText(text, targetLang) {
  const tl = gLang[targetLang] || targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    let translated = '';
    for (let i = 0; i < data[0].length; i++) {
      if (data[0][i][0]) translated += data[0][i][0];
    }
    return translated;
  } catch (err) {
    console.error(`Error translating to ${targetLang}:`, err);
    return text;
  }
}

async function translateObj(obj, targetLang) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object') {
      result[key] = await translateObj(val, targetLang);
    } else {
      let translated = await translateText(val, targetLang);
      // Fix variables like {name} or {count} that might get spaces like { name }
      translated = translated.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, '{$1}');
      result[key] = translated;
      // Sleep to prevent rate limits
      await new Promise(r => setTimeout(r, 100));
    }
  }
  return result;
}

async function main() {
  const enFile = path.join(__dirname, 'src', 'i18n', 'messages', 'en.json');
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf-8'));

  for (const loc of locales) {
    const outFile = path.join(__dirname, 'src', 'i18n', 'messages', `${loc}.json`);
    if (fs.existsSync(outFile)) {
      console.log(`Skipping ${loc}.json (already exists)`);
      continue;
    }
    console.log(`Translating to ${loc}...`);
    const translatedData = await translateObj(enData, loc);
    fs.writeFileSync(outFile, JSON.stringify(translatedData, null, 2));
    console.log(`Saved ${loc}.json`);
  }
  console.log('All translations done.');
}

main().catch(console.error);
