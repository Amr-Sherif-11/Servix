const fs = require('fs');
const path = require('path');

const locales = [
  'ar', 'fr', 'es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt',
  'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv',
  'da', 'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'
];

const msgDir = path.join(__dirname, '..', 'src', 'i18n', 'messages');
const enFile = path.join(msgDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
const locFile = path.join(__dirname, '..', 'src', 'i18n', 'locations', 'en.json');
const locData = fs.existsSync(locFile) ? JSON.parse(fs.readFileSync(locFile, 'utf-8')) : {};
enData.locations = locData;

function clearUntranslated(enObj, targetObj) {
  let clearedCount = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (!targetObj[key]) targetObj[key] = {};
      clearedCount += clearUntranslated(enObj[key], targetObj[key]);
    } else {
      // If the target has the exact same English value as the source, and it's not English language itself
      if (targetObj[key] === enObj[key]) {
        targetObj[key] = "";
        clearedCount++;
      }
    }
  }
  return clearedCount;
}

for (const loc of locales) {
  const targetFile = path.join(msgDir, `${loc}.json`);
  if (!fs.existsSync(targetFile)) continue;
  const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
  
  if (enData.locations && targetData.locations) {
    const count = clearUntranslated(enData.locations, targetData.locations);
    if (count > 0) {
      fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2), 'utf-8');
      console.log(`Cleared ${count} untranslated location names in ${loc}.json`);
    } else {
      console.log(`${loc}.json has no exact English matches to clear.`);
    }
  }
}
