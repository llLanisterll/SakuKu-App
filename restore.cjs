const fs = require('fs');
const path = require('path');

const backups = [
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471528554_0_65iby.txt',
    targetFile: 'src/App.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780473314206_1_006sk.txt',
    targetFile: 'src/app.css'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471519871_1_584ihn.txt',
    targetFile: 'src/components/ExpenseEntry.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471523784_0_ug5dw4.txt',
    targetFile: 'src/components/Dashboard.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471690632_0_50s23q.txt',
    targetFile: 'src/components/CategoriesManager.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471523797_1_xmlyog.txt',
    targetFile: 'src/components/TransactionHistory.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471519859_0_larzb.txt',
    targetFile: 'src/lib/store.svelte.js'
  }
];

for (const b of backups) {
  try {
    if (fs.existsSync(b.jsonFile)) {
      const data = fs.readFileSync(b.jsonFile, 'utf8');
      // Some files might have the <tool_output_masked> wrapping
      let jsonStr = data;
      const match = data.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
      const json = JSON.parse(jsonStr);
      let content = json.output;
      // remove the warning prefix if present
      if (content.includes('IMPORTANT: The file content has been truncated.')) {
        content = content.replace(/\nIMPORTANT: The file content has been truncated\.[\s\S]*?--- FILE CONTENT \(truncated\) ---\n/, '');
      }
      fs.writeFileSync(path.join(__dirname, b.targetFile), content);
      console.log(`Restored ${b.targetFile}`);
    } else {
      console.log(`Backup not found for ${b.targetFile}: ${b.jsonFile}`);
    }
  } catch (e) {
    console.error(`Error restoring ${b.targetFile}:`, e.message);
  }
}
