const fs = require('fs');
const path = require('path');

const locales = [
  'ar', 'fr', 'es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt',
  'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv',
  'da', 'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'
];

const gLang = { 'zh': 'zh-CN' };

async function translateBatch(texts, targetLang) {
  if (targetLang === 'en') return texts;
  if (texts.length === 0) return [];
  const tl = gLang[targetLang] || targetLang;

  // Combine texts with ||| separator
  const combined = texts.join(' ||| ');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t`;

  // Try translating up to 3 times with exponential backoff on failure
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'q=' + encodeURIComponent(combined)
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      let translated = '';
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) translated += data[0][i][0];
      }
      
      // Split using robust regex to support spaces around separator
      const arr = translated.split(/\s*\|\|\|\s*/).map(t => t.trim());
      
      // Fix variables in each translated text (e.g. {name} -> {name})
      const finalArr = arr.map(t => t.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, '{$1}'));

      // If length matches, we are good!
      if (finalArr.length === texts.length) {
        return finalArr;
      } else {
        console.warn(`[Warning] Translated batch size mismatch for ${targetLang}. Expected ${texts.length}, got ${finalArr.length}. Falling back to individual translation.`);
        // Fall back to translating individually in this batch
        const individualTranslations = [];
        for (const t of texts) {
          const individualUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t`;
          const indRes = await fetch(individualUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'q=' + encodeURIComponent(t)
          });
          const indData = await indRes.json();
          let indTrans = '';
          for (let i = 0; i < indData[0].length; i++) {
            if (indData[0][i][0]) indTrans += indData[0][i][0];
          }
          individualTranslations.push(indTrans.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, '{$1}'));
          await new Promise(r => setTimeout(r, 150));
        }
        return individualTranslations;
      }
    } catch (err) {
      console.error(`Attempt ${attempt} failed translating batch to ${targetLang}:`, err.message);
      if (attempt === 3) {
        // Fallback to original texts on complete failure
        return texts;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
}

// Traverses an object and returns all paths that are leaves (strings)
function getLeaves(obj, currentPath = []) {
  let leaves = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      leaves = leaves.concat(getLeaves(value, [...currentPath, key]));
    } else {
      leaves.push({ path: [...currentPath, key], value });
    }
  }
  return leaves;
}

function getPathValue(obj, path) {
  let current = obj;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

function setPathValue(obj, path, value) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
}

async function main() {
  const msgDir = path.join(__dirname, '..', 'src', 'i18n', 'messages');
  const enFile = path.join(msgDir, 'en.json');
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
  // Load locations data and merge into the translation object
  const locFile = path.join(__dirname, '..', 'src', 'i18n', 'locations', 'en.json');
  const locData = fs.existsSync(locFile) ? JSON.parse(fs.readFileSync(locFile, 'utf-8')) : {};
  enData.locations = locData;
  const leaves = getLeaves(enData);

  for (const loc of locales) {
    const locFile = path.join(msgDir, `${loc}.json`);
    let locData = {};
    if (fs.existsSync(locFile)) {
      try {
        locData = JSON.parse(fs.readFileSync(locFile, 'utf-8'));
      } catch (err) {
        console.error(`Failed to parse ${loc}.json:`, err.message);
      }
    }
    
    console.log(`Checking missing keys for ${loc}.json...`);
    const missingLeaves = [];
    for (const leaf of leaves) {
      const existing = getPathValue(locData, leaf.path);
      if (existing === undefined || existing === null || existing === "") {
        missingLeaves.push(leaf);
      }
    }

    if (missingLeaves.length > 0) {
      console.log(`Found ${missingLeaves.length} missing keys in ${loc}.json. Translating in batch...`);
      const textsToTranslate = missingLeaves.map(l => l.value);
      const translatedTexts = await translateBatch(textsToTranslate, loc);

      for (let i = 0; i < missingLeaves.length; i++) {
        const leaf = missingLeaves[i];
        const translated = translatedTexts[i] || leaf.value;
        setPathValue(locData, leaf.path, translated);
      }

      fs.writeFileSync(locFile, JSON.stringify(locData, null, 2), 'utf-8');
      console.log(`Successfully updated ${loc}.json with ${missingLeaves.length} new translations.`);
      
      // Delay slightly to prevent rapid connections
      await new Promise(r => setTimeout(r, 300));
    } else {
      console.log(`${loc}.json is up to date.`);
    }
  }
  console.log("All translation synchronization complete!");
}

main().catch(console.error);
