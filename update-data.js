const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'js', 'data.js');
let content = fs.readFileSync(dataFile, 'utf8');

// Inject cachePrice: 0.05
content = content.replace(/(\s+)outputPrice: ([\d.]+),/g, (match, space, price) => {
  return match + space + 'cachePrice: 0.05,';
});

// Update thirdPartyPricing
content = content.replace(/thirdPartyPricing:\s*\{[\s\S]*?\},/g, `thirdPartyPricing: {
      openrouter: { input: 0.10, cachePrice: 0.05, output: 0.20 },
      sumopod: { input: 0.08, cachePrice: 0.04, output: 0.15 },
      deepinfra: { input: 0.09, cachePrice: 0.05, output: 0.18 }
    },`);

fs.writeFileSync(dataFile, content, 'utf8');
console.log('Done modifying data.js');
