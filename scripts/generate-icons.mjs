import { Jimp } from 'jimp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

async function makeIcon(size) {
  const img = new Jimp({ width: size, height: size, color: 0x2563ebff });
  await img.write(join(outDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

await makeIcon(192);
await makeIcon(512);
console.log('Done — icons saved to public/icons/');
