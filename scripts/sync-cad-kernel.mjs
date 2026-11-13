// Serve the pinned kernel locally. Customer designs never leave the browser here.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const directory = 'public/cad-kernel';
mkdirSync(directory, { recursive: true });
const files = ['manifold.js', 'manifold.wasm', 'LICENSE'];
const hashes = {};
for (const file of files) {
  const source = `node_modules/manifold-3d/${file}`;
  copyFileSync(source, `${directory}/${file}`);
  hashes[file] = createHash('sha256').update(readFileSync(source)).digest('hex');
}
writeFileSync(`${directory}/version.json`, JSON.stringify({ package: 'manifold-3d', version: JSON.parse(readFileSync('node_modules/manifold-3d/package.json')).version, license: 'Apache-2.0', source: 'https://github.com/elalish/manifold', hashes }, null, 2));
