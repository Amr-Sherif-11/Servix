const fs = require('fs');

const pageFile = 'src/app/auth/register/page.tsx';
const translatedFile = 'translated_t.json';

let content = fs.readFileSync(pageFile, 'utf-8');
const translations = JSON.parse(fs.readFileSync(translatedFile, 'utf-8'));

let injectStr = '';
for (const { loc, newObj } of translations) {
  // If locale is already in page.tsx (like fr or ar), we could skip it or let it duplicate (bad).
  if (['en', 'ar', 'fr'].includes(loc)) continue;

  injectStr += `,\n    ${loc}: {\n`;
  for (const [k, v] of Object.entries(newObj)) {
    // Escape single quotes just in case
    const escapedVal = v.replace(/'/g, "\\'");
    injectStr += `      ${k}: '${escapedVal}',\n`;
  }
  injectStr += `    }`;
}

// We need to inject after the 'fr' object.
// The end of the t object is:
//       searchLang: 'Rechercher une langue...'
//     }
//   }
//   const txt = (t as any)[tempLocale] || t.en

// Let's replace the ending '    }\n  }' with '    }' + injectStr + '\n  } as any'
const target = `      searchLang: 'Rechercher une langue...'\n    }\n  }`;
const replacement = `      searchLang: 'Rechercher une langue...'\n    }${injectStr}\n  } as any`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(pageFile, content);
  console.log('Successfully injected translations!');
} else {
  console.log('Target string not found in page.tsx!');
}
