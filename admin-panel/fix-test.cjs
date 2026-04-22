const fs = require('fs');
let content = fs.readFileSync('src/pages/__tests__/StudentFeeChallanDetailSync.test.jsx', 'utf8');

// The corrupted line contains a literal backtick-n instead of a real newline
// Find and replace the entire bad section
const badPattern = /const safeValue = String\(value\)\.replace\(\/\\\$\\\$\/g, "\$\$\$\$"\);\`n    finalHtml = finalHtml\.replace\(new RegExp\(escapedKey, "g"\), safeValue\);/;

const goodReplacement = `const safeValue = String(value).replace(/\\$/g, '$$$$');\r\n    finalHtml = finalHtml.replace(new RegExp(escapedKey, 'g'), safeValue);`;

if (badPattern.test(content)) {
  content = content.replace(badPattern, goodReplacement);
  fs.writeFileSync('src/pages/__tests__/StudentFeeChallanDetailSync.test.jsx', content, 'utf8');
  console.log('Fixed!');
} else {
  console.log('Pattern not found, trying line-based approach...');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('safeValue') && lines[i].includes('`n')) {
      console.log('Found bad line at index', i, ':', JSON.stringify(lines[i]));
      lines[i] = "    const safeValue = String(value).replace(/\\$/g, '$$$$');\r";
      lines.splice(i + 1, 0, "    finalHtml = finalHtml.replace(new RegExp(escapedKey, 'g'), safeValue);\r");
      content = lines.join('\n');
      fs.writeFileSync('src/pages/__tests__/StudentFeeChallanDetailSync.test.jsx', content, 'utf8');
      console.log('Fixed via line approach!');
      break;
    }
  }
}
