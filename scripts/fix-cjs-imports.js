import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir, stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  
  // Replace .js imports with .cjs
  const updatedContent = content.replace(
    /require\(['"]([^'"]+)\.js['"]\)/g,
    "require('$1.cjs')"
  );

  writeFileSync(filePath, updatedContent);
}

async function processDirectory(dir) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stats = await stat(fullPath);
    
    if (stats.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.endsWith('.cjs')) {
      processFile(fullPath);
    }
  }
}

// Start processing from dist/cjs
processDirectory(join(__dirname, '..', 'dist', 'cjs'))
  .catch(console.error);
