import {cp, copyFile, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('vercel-public/', root);
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await cp(new URL('public/', root), output, {recursive: true});
await copyFile(new URL('web/index.html', root), new URL('index.html', output));
console.log(`Vercel public site built in ${fileURLToPath(output)}`);
