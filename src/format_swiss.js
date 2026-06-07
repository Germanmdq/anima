const fs = require('fs');
const path = require('path');

const swissObj = require('/Users/germangonzalez/.gemini/antigravity-ide/brain/e8485787-e47b-4f1e-9bcc-007853401e5a/scratch/swiss_obj.js');

let output = '';
output += `# Swiss Minimalist Layout Ideas\n\n`;
for (const [key, value] of Object.entries(swissObj.layoutIdeas)) {
  output += `## ${key}\n${value}\n\n`;
}

output += `\n# Swiss Minimalist Markdown Content\n\n`;
output += swissObj.content;

fs.writeFileSync('/Users/germangonzalez/.gemini/antigravity-ide/brain/e8485787-e47b-4f1e-9bcc-007853401e5a/scratch/swiss_content.md', output);
console.log("Saved formatted content to scratch/swiss_content.md");
