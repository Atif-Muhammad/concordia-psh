const fs = require('fs');

function fixFile(filePath, lineIndex) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the line with the bad replacement
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('finalHtml = finalHtml.replace(new RegExp(escapedKey') && line.includes(', value)')) {
      console.log(`Found at line ${i} in ${filePath}:`, JSON.stringify(line));
      const indent = line.match(/^(\s*)/)[1];
      lines[i] = `${indent}const safeValue = String(value).replace(/\\$/g, '$$$$');\r`;
      lines.splice(i + 1, 0, `${indent}finalHtml = finalHtml.replace(new RegExp(escapedKey, 'g'), safeValue);\r`);
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${filePath}!`);
      return;
    }
  }
  console.log(`Pattern not found in ${filePath}`);
}

fixFile('src/pages/FeeManagement.jsx');
fixFile('src/pages/Students.jsx');
