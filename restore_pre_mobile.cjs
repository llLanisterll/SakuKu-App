const fs = require('fs');
const path = require('path');

const backups = [
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780473314206_1_006sk.txt',
    targetFile: 'src/app.css'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/write_file_write_file__write_file_1780474629240_0_zarsz.txt',
    targetFile: 'src/components/TransactionHistory.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/write_file_write_file__write_file_1780476560203_1_yd4by9.txt',
    targetFile: 'src/components/Settings.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/write_file_write_file__write_file_1780476803046_1_a8z6.txt',
    targetFile: 'src/App.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780473211596_0_k17gxi.txt',
    targetFile: 'src/lib/store.svelte.js'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/write_file_write_file__write_file_1780473095276_0_7gkio.txt',
    targetFile: 'src/components/ExpenseEntry.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780473205259_0_vhkvd.txt',
    targetFile: 'src/components/CategoriesManager.svelte'
  },
  {
    jsonFile: '/Users/sarhamsan/.gemini/tmp/pengeluaran/tool-outputs/session-4b91df04-ddd4-4732-92cc-57109d54f3fd/read_file_read_file__read_file_1780471523784_0_ug5dw4.txt',
    targetFile: 'src/components/Dashboard.svelte'
  }
];

for (const b of backups) {
  try {
    if (fs.existsSync(b.jsonFile)) {
      const data = fs.readFileSync(b.jsonFile, 'utf8');
      let jsonStr = data;
      const match = data.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
      let json;
      try {
        json = JSON.parse(jsonStr);
      } catch (e) {
        // If it fails to parse as JSON (maybe it's raw text), use raw text
        console.warn(`Could not parse JSON from ${b.jsonFile}, using raw output.`);
      }
      
      let content = json ? json.output : data;

      // Ensure we don't accidentally write the <tool_output_masked> wrapping or truncated messages
      if (content.includes('IMPORTANT: The file content has been truncated.')) {
         content = content.replace(/\nIMPORTANT: The file content has been truncated\.[\s\S]*?--- FILE CONTENT \(truncated\) ---\n/, '');
      }

      if (content) {
         fs.writeFileSync(path.join(__dirname, b.targetFile), content);
         console.log(`Restored ${b.targetFile}`);
      } else {
        console.log(`Failed to extract content for ${b.targetFile}`);
      }
    } else {
      console.log(`Backup not found for ${b.targetFile}: ${b.jsonFile}`);
    }
  } catch (e) {
    console.error(`Error restoring ${b.targetFile}:`, e.message);
  }
}
