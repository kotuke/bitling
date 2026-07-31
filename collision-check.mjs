import { createAvatarDescriptor } from "./src/avatar.mjs";

const sampleSize = Number(process.env.AVATAR_COLLISION_SAMPLE ?? 100_000);
if (!Number.isInteger(sampleSize) || sampleSize < 1) {
  throw new Error("AVATAR_COLLISION_SAMPLE must be a positive integer");
}

const secret = "collision-test-secret-at-least-16";
const visualSignatures = new Set();
let duplicates = 0;

for (let index = 0; index < sampleSize; index += 1) {
  const avatar = createAvatarDescriptor(`user-${index}`, { secret });
  const signature = `${avatar.accent}:${JSON.stringify(avatar.pixels)}`;
  if (visualSignatures.has(signature)) duplicates += 1;
  else visualSignatures.add(signature);
}

console.log(JSON.stringify({
  users: sampleSize,
  visualDuplicates: duplicates,
  uniqueVisuals: visualSignatures.size,
}, null, 2));
