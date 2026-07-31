import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";

import {
  assertAvatarDescriptor,
  createAvatarDescriptor,
  generateAvatarPng,
  generateAvatarSvg,
  renderAvatarSvg,
} from "../src/avatar.mjs";

const SECRET = "test-secret-with-at-least-16-characters";

function decodeRgbPng(png) {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const compressed = [];
  let offset = 8;

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") compressed.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }

  const raw = inflateSync(Buffer.concat(compressed));
  const rowLength = width * 3 + 1;
  assert.equal(raw.length, rowLength * height);
  for (let row = 0; row < height; row += 1) {
    assert.equal(raw[row * rowLength], 0);
  }

  return {
    width,
    height,
    pixel(column, row) {
      const pixelOffset = row * rowLength + 1 + column * 3;
      return [...raw.subarray(pixelOffset, pixelOffset + 3)];
    },
  };
}

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

test("same user and secret always produce the same descriptor", () => {
  const first = createAvatarDescriptor("user-123", { secret: SECRET });
  const second = createAvatarDescriptor("user-123", { secret: SECRET });
  assert.deepEqual(first, second);
});

test("different users produce different fingerprints", () => {
  const fingerprints = new Set();
  for (let index = 0; index < 1000; index += 1) {
    fingerprints.add(createAvatarDescriptor(`user-${index}`, { secret: SECRET }).fingerprint);
  }
  assert.equal(fingerprints.size, 1000);
});

test("a deterministic cohort of 10,000 users has no visual collisions", () => {
  const visualSignatures = new Set();
  for (let index = 0; index < 10_000; index += 1) {
    const descriptor = createAvatarDescriptor(`user-${index}`, { secret: SECRET });
    visualSignatures.add(`${descriptor.accent}:${JSON.stringify(descriptor.pixels)}`);
  }
  assert.equal(visualSignatures.size, 10_000);
});

test("changing the secret changes the avatar without exposing the identifier", () => {
  const first = createAvatarDescriptor("private-user-id", { secret: SECRET });
  const second = createAvatarDescriptor("private-user-id", {
    secret: "a-different-secret-with-at-least-16-characters",
  });
  assert.notEqual(first.fingerprint, second.fingerprint);
  assert.doesNotMatch(JSON.stringify(first), /private-user-id/);
});

test("generated sigils are symmetric, connected and bounded", () => {
  for (let index = 0; index < 500; index += 1) {
    const descriptor = createAvatarDescriptor(`symmetry-${index}`, { secret: SECRET });
    assert.equal(assertAvatarDescriptor(descriptor), descriptor);

    const columns = descriptor.pixels.map(([column]) => column);
    assert.equal(Math.min(...columns) + Math.max(...columns), 0);
  }
});

test("SVG has a full background and no rounded or embedded primitives", () => {
  const svg = generateAvatarSvg("svg-user", { secret: SECRET, size: 64 });
  assert.match(svg, /width="64" height="64" viewBox="0 0 1254 1254"/);
  assert.match(svg, /<rect width="1254" height="1254" fill="#080A0E"\/>/);
  assert.doesNotMatch(svg, /<(circle|ellipse|image|polygon|polyline)\b/);
  assert.doesNotMatch(svg, /\brx=/);
  assert.doesNotMatch(svg, /svg-user/);
});

test("SVG title is safely escaped", () => {
  const descriptor = createAvatarDescriptor("title-user", { secret: SECRET });
  const svg = renderAvatarSvg(descriptor, { title: `<Robot & "friend">` });
  assert.match(svg, /&lt;Robot &amp; &quot;friend&quot;&gt;/);
  assert.doesNotMatch(svg, /<Robot/);
});

test("render API rejects a forged descriptor before writing XML", () => {
  const descriptor = createAvatarDescriptor("forged-descriptor", { secret: SECRET });
  assert.throws(
    () => renderAvatarSvg({
      ...descriptor,
      fingerprint: `x\"><script>alert(1)</script>`,
    }),
    /fingerprint/,
  );
  assert.throws(
    () => renderAvatarSvg({ ...descriptor, version: "v999" }),
    /version/,
  );
});

test("PNG is deterministic, opaque RGB and has the requested dimensions", () => {
  const first = generateAvatarPng("png-user", { secret: SECRET, size: 64 });
  const second = generateAvatarPng("png-user", { secret: SECRET, size: 64 });
  assert.deepEqual(first, second);
  assert.deepEqual(first.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(first.readUInt32BE(16), 64);
  assert.equal(first.readUInt32BE(20), 64);
  assert.equal(first[24], 8);
  assert.equal(first[25], 2);
});

test("PNG eye pixels remain an exact mirror pair at small sizes", () => {
  const descriptor = createAvatarDescriptor("eye-symmetry", { secret: SECRET });
  for (const size of [32, 64]) {
    const decoded = decodeRgbPng(generateAvatarPng("eye-symmetry", {
      secret: SECRET,
      size,
    }));
    const left = Math.round((594 * size) / 1254 - 0.5);
    const right = size - 1 - left;
    const row = Math.round((759 * size) / 1254 - 0.5);
    const accent = hexToRgb(descriptor.accent);
    assert.deepEqual(decoded.pixel(left, row), accent);
    assert.deepEqual(decoded.pixel(right, row), accent);
  }
});

test("invalid identifiers, secrets and sizes fail closed", () => {
  assert.throws(() => generateAvatarSvg("", { secret: SECRET }), /userId/);
  assert.throws(() => generateAvatarSvg("user", { secret: "" }), /secret/);
  assert.throws(() => generateAvatarSvg("user", { secret: "too-short" }), /16 characters/);
  assert.throws(() => generateAvatarPng("user", { secret: SECRET, size: 31 }), /size/);
  assert.throws(() => generateAvatarPng("user", { secret: SECRET, size: 2049 }), /size/);
});
