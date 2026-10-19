import { mkdir, copyFile, cp, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(path.join(root, 'index.html'), path.join(output, 'index.html'));
for (const project of ['atlas', 'prospeccao', 'cardapio', 'minermais']) {
  await cp(path.join(root, project), path.join(output, project), { recursive: true });
}
await cp(path.join(root, 'projetos'), path.join(output, 'projetos'), {
  recursive: true,
  filter: entry => !entry.includes('__pycache__') && !entry.endsWith('.pyc'),
});
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Portfólio preparado em dist/.');
