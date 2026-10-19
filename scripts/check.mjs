import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Há IDs duplicados no HTML.');
const idSet = new Set(ids);
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!idSet.has(target)) throw new Error(`Âncora inexistente: ${target}`);
}
const files = new Set([...html.matchAll(/(?:href=|document:|code:)['"](projetos\/[^'"]+)['"]/g)].map(match => match[1]));
for (const file of files) {
  if (!(await stat(path.join(root, file))).isFile()) throw new Error(`Arquivo ausente: ${file}`);
}
for (const [index, [, script]] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) {
  new vm.Script(script, { filename: `inline-${index + 1}.js` });
}
if (!html.includes('lang="pt-BR"')) throw new Error('Idioma da página ausente.');
if (!html.includes('prefers-reduced-motion')) throw new Error('Preferência de movimento reduzido ausente.');
if ([...html.matchAll(/(?:href|src)="([^"\n]+)"/g)].some(([, value]) => /(?:SEU_USUARIO|TODO|example\.com)/.test(value))) {
  throw new Error('Há links temporários no site.');
}
console.log(`Validação concluída: ${ids.length} IDs únicos, ${files.size} arquivos locais e JavaScript válido.`);
