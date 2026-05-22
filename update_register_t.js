const fs = require('fs');
const https = require('https');

const PAGE_PATH = 'd:/Servix/src/app/auth/register/page.tsx';
let content = fs.readFileSync(PAGE_PATH, 'utf-8');

const newKeys = {
  step1Desc: 'Choose your language and location to start',
  step2Desc: 'How do you want to use Servix?',
  step3Desc: 'Enter your personal information',
  step4Desc: 'Tell clients about your skills',
  confirmPassword: 'Confirm Password',
  otpLengthError: 'Code must be 6 digits'
};

async function translateText(text, targetLang) {
  if (targetLang === 'en') return text;
  
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + targetLang + '&dt=t&q=' + encodeURIComponent(text);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0][0][0]);
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

async function updateTranslations() {
  const tMatch = content.match(/const t = (\{[\s\S]+?\n  \}) as any/);
  if (!tMatch) return console.log('Could not find t object');
  
  let tObj = null;
  eval('tObj = ' + tMatch[1]);
  
  for (const lang of Object.keys(tObj)) {
    console.log('Translating for ' + lang + '...');
    for (const [key, text] of Object.entries(newKeys)) {
      if (!tObj[lang][key]) {
        tObj[lang][key] = await translateText(text, lang);
      }
    }
  }
  
  let newTStr = 'const t = {\n';
  for (const [lang, translations] of Object.entries(tObj)) {
    newTStr += `    ${lang}: {\n`;
    for (const [key, val] of Object.entries(translations)) {
      newTStr += `      ${key}: \`${val.replace(/\`/g, "\\`")}\`,\n`;
    }
    newTStr += `    },\n`;
  }
  newTStr += `  } as any`;
  
  content = content.replace(tMatch[0], newTStr);
  fs.writeFileSync(PAGE_PATH, content, 'utf-8');
  console.log('Done updating t object!');
}

updateTranslations();
