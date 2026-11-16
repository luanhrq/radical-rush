// Junta src/ num único index.html (o que o GitHub Pages publica).
//   node build.mjs
// Os arquivos de src/js são concatenados na ordem do nome (00-, 01-, ...) dentro de um único <script type="module">,
// então todos compartilham o mesmo escopo: não há import/export entre eles.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (...p) => path.join(here, 'src', ...p);
const files = readdirSync(src('js')).filter((f) => f.endsWith('.js')).sort();
const js = files.map((f) => readFileSync(src('js', f), 'utf8')).join('');
const css = readFileSync(src('style.css'), 'utf8');
const html = readFileSync(src('template.html'), 'utf8')
  .replace('/*STYLE*/', () => css)
  .replace('/*SCRIPT*/', () => js);
writeFileSync(path.join(here, 'index.html'), html);
console.log(`index.html: ${(html.length / 1024).toFixed(1)} kB, ${files.length} módulos`);
