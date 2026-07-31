import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  createAvatarDescriptor,
  renderAvatarPng,
  renderAvatarSvg,
} from "../src/avatar.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(directory, "generated");
const secret = process.env.AVATAR_SECRET ?? "sample-secret-not-for-production";

await mkdir(outputDirectory, { recursive: true });

for (let index = 1; index <= 12; index += 1) {
  const descriptor = createAvatarDescriptor(`sample-user-${index}`, { secret });
  const name = `sample-${String(index).padStart(2, "0")}`;
  await writeFile(join(outputDirectory, `${name}.svg`), renderAvatarSvg(descriptor, { size: 256 }));
  await writeFile(join(outputDirectory, `${name}.png`), renderAvatarPng(descriptor, { size: 256 }));
  await writeFile(join(outputDirectory, `${name}-64.png`), renderAvatarPng(descriptor, { size: 64 }));
}

console.log(`Generated 12 SVG and 24 PNG files in ${outputDirectory}`);
