import { performance } from "node:perf_hooks";

import {
  createAvatarDescriptor,
  renderAvatarPng,
  renderAvatarSvg,
} from "./src/avatar.mjs";

const SECRET = "benchmark-secret-at-least-16-characters";

function benchmark(label, iterations, operation) {
  const startedAt = performance.now();
  for (let index = 0; index < iterations; index += 1) operation(index);
  const elapsed = performance.now() - startedAt;
  console.log(`${label}: ${iterations} in ${elapsed.toFixed(1)} ms (${(elapsed / iterations).toFixed(3)} ms/avatar)`);
}

benchmark("descriptor + SVG 256px", 10_000, (index) => {
  const descriptor = createAvatarDescriptor(`svg-${index}`, { secret: SECRET });
  renderAvatarSvg(descriptor, { size: 256 });
});

benchmark("descriptor + PNG 256px", 500, (index) => {
  const descriptor = createAvatarDescriptor(`png-${index}`, { secret: SECRET });
  renderAvatarPng(descriptor, { size: 256 });
});
