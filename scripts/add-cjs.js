import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  
  // Convert ESM to CJS
  const cjsContent = `"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

${content
    .replace(/export\s+default\s+/g, 'exports.default = ')
    .replace(/export\s+const\s+(\w+)/g, 'exports.$1')
    .replace(/export\s+function\s+(\w+)/g, 'exports.$1 = function $1')
    .replace(/export\s+\{([^}]+)\}/g, (_, names) => {
      return names
        .split(',')
        .map(name => {
          const trimmed = name.trim();
          const [local, exported = local] = trimmed.split(/\s+as\s+/);
          return `exports.${exported.trim()} = ${local.trim()};`;
        })
        .join('\n');
    })
    .replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, (_, names, path) => {
      return `const { ${names} } = require('${path}');`;
    })
    .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require(\'$2\');')}`;

  writeFileSync(filePath, cjsContent);
}

function processDirectory(dir) {
  const fs = await import('fs/promises');
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

// Start processing from dist/cjs
processDirectory(join(__dirname, '..', 'dist', 'cjs'));
