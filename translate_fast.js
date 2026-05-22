const fs = require('fs');
const path = require('path');

const locales = ['es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt', 'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'];

const gLang = { 'zh': 'zh-CN' };

async function translateBatch(texts, targetLang) {
  const tl = gLang[targetLang] || targetLang;
  
  // Google Translate preserves newlines
  const combined = texts.join('\n');
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + tl + '&dt=t';
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'q=' + encodeURIComponent(combined)
    });
    const data = await res.json();
    let translated = '';
    for (let i = 0; i < data[0].length; i++) {
      if (data[0][i][0]) translated += data[0][i][0];
    }
    // Fix variables
    let arr = translated.split('\n');
    return arr.map(t => t.trim().replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, '{$1}'));
  } catch (err) {
    console.error(`Error translating to ${targetLang}:`, err);
    return texts;
  }
}

function extractStrings(obj, arr = [], paths = [], currentPath = '') {
  for (const [key, val] of Object.entries(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      extractStrings(val, arr, paths, newPath);
    } else {
      arr.push(val);
      paths.push(newPath);
    }
  }
  return { arr, paths };
}

function setString(obj, pathStr, value) {
  const keys = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

async function main() {
  // 1. Translate messages JSON
  const enFile = path.join(__dirname, 'src', 'i18n', 'messages', 'en.json');
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
  
  const { arr: textsToTranslate, paths } = extractStrings(enData);
  
  console.log(`Extracted ${textsToTranslate.length} strings from messages. Translating...`);

  const promises = locales.map(async (loc) => {
    const outFile = path.join(__dirname, 'src', 'i18n', 'messages', `${loc}.json`);
    const translatedTexts = await translateBatch(textsToTranslate, loc);
    const newObj = {};
    for (let i = 0; i < paths.length; i++) {
      setString(newObj, paths[i], translatedTexts[i] || textsToTranslate[i]);
    }
    fs.writeFileSync(outFile, JSON.stringify(newObj, null, 2));
    console.log(`Saved messages/${loc}.json`);
  });

  await Promise.all(promises);

  // 2. Translate register page "t" object
  const pageFile = path.join(__dirname, 'src', 'app', 'auth', 'register', 'page.tsx');
  let pageContent = fs.readFileSync(pageFile, 'utf-8');
  
  // Extract the english object from page.tsx (it's between "en: {" and "}, ar: {")
  // For simplicity, we just define it here since we know the keys.
  const pageEn = {
    step1: 'Your Location',
    step2: 'Choose Role',
    step3: 'Account Details',
    step4: 'Professional Info',
    userTitle: 'I need a service',
    userDesc: 'Find and hire skilled professionals',
    proTitle: 'I offer services',
    proDesc: 'Grow your professional business',
    next: 'Continue',
    back: 'Back',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    profession: 'Profession',
    specialization: 'Specialization',
    bio: 'Bio',
    price: 'Price',
    signUp: 'Create Account',
    hasAccount: 'Already have an account?',
    signIn: 'Sign In',
    country: 'Country',
    city: 'City',
    lang: 'Language',
    verifyTitle: 'Verify Account',
    verifyDesc: 'Enter the code sent to',
    verifyBtn: 'Verify Account',
    otpPlaceholder: '000000',
    invalidOtp: 'Invalid or expired code',
    searchCountry: 'Search countries...',
    searchCity: 'Search cities...',
    searchLang: 'Search languages...'
  };

  const { arr: pageTexts, paths: pagePaths } = extractStrings(pageEn);

  console.log(`Translating register page strings...`);
  
  const pagePromises = locales.map(async (loc) => {
    const translatedTexts = await translateBatch(pageTexts, loc);
    const newObj = {};
    for (let i = 0; i < pagePaths.length; i++) {
      setString(newObj, pagePaths[i], translatedTexts[i] || pageTexts[i]);
    }
    return { loc, newObj };
  });

  const pageResults = await Promise.all(pagePromises);
  
  // Reconstruct t object string
  let tObjStr = `\n`;
  for (const { loc, newObj } of pageResults) {
    tObjStr += `    ${loc}: {\n`;
    for (const [k, v] of Object.entries(newObj)) {
      tObjStr += `      ${k}: \`${v.replace(/`/g, '\\`')}\`,\n`;
    }
    tObjStr += `    },\n`;
  }

  // Insert into page.tsx before "const txt = t[tempLocale]"
  pageContent = pageContent.replace(/const txt = t\[tempLocale as keyof typeof t\] \|\| t\.en/g, "const txt = (t as any)[tempLocale] || t.en");
  
  // I will just let the user see the translations or we can inject them carefully.
  // Actually, I'll inject them just before `  } // END T OBJECT`
  // The simplest is to output them to a file and Antigravity can patch them, or we can just append them inside `t = { ... }`.
  
  const injectToken = "    fr: {"; // we will find 'fr' and replace it with 'fr' + the rest
  
  let restOfStr = `    fr: {\n`;
  // find what's in fr currently, actually it's fine, we can just replace the whole t object but we might mess up formatting.
  // Let's just create a new ts file with the full t object so Antigravity can copy it.
  
  let fullT = `const t = {\n  en: ${JSON.stringify(pageEn, null, 4)},\n`;
  // ar
  // fr
  // and rest
  
  fs.writeFileSync('translated_t.json', JSON.stringify(pageResults, null, 2));
  console.log('Done translated_t.json');
}

main().catch(console.error);
