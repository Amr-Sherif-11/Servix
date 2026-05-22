const fs = require('fs');
const https = require('https');

const PAGE_PATH = 'd:/Servix/src/app/auth/login/page.tsx';
let content = fs.readFileSync(PAGE_PATH, 'utf-8');

const newKeys = {
  title: 'Welcome back',
  subtitle: 'Sign in to your account',
  email: 'Email address',
  password: 'Password',
  forgot: 'Forgot password?',
  signIn: 'Sign In',
  noAccount: "Don't have an account?",
  register: 'Register',
  orWith: 'Or continue with',
  facebook: 'Continue with Facebook'
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

// All languages in Servix
const locales = [
  'en', 'ar', 'fr', 'es', 'de', 'tr', 'fa', 'ur', 'hi', 'bn', 'pt', 
  'ru', 'zh', 'ja', 'ko', 'id', 'ms', 'it', 'nl', 'pl', 'sv', 'da', 
  'no', 'fi', 'cs', 'ro', 'hu', 'el', 'th', 'vi', 'uk'
];

async function updateTranslations() {
  const tMatch = content.match(/const t = (\{[\s\S]+?\n  \})/);
  if (!tMatch) return console.log('Could not find t object');
  
  let tObj = null;
  eval('tObj = ' + tMatch[1]);
  
  // Ensure all locales exist in tObj
  for (const lang of locales) {
    if (!tObj[lang]) {
      tObj[lang] = {};
    }
  }
  
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
  newTStr += `  }`;
  
  content = content.replace(tMatch[0], newTStr);
  fs.writeFileSync(PAGE_PATH, content, 'utf-8');
  console.log('Done updating t object!');
}

updateTranslations();
