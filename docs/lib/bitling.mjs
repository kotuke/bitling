/**
 * Browser entry point: the same sigil builder and SVG renderer as in Node, with
 * the HMAC seed computed by the bundled SHA-256 instead of `node:crypto`.
 * PNG output stays Node-only — it needs zlib.
 */
import { hmacSha256, utf8Bytes } from "./sha256.mjs";
import { AVATAR_VERSION, PALETTE, descriptorFromSeed, renderAvatarSvg } from "./avatar.mjs";

export { AVATAR_VERSION, PALETTE, renderAvatarSvg };

function seedFor(userId, secret) {
  if (typeof userId !== "string" || userId.length === 0) {
    throw new TypeError("userId must be a non-empty string");
  }
  if (typeof secret !== "string" || secret.length < 16) {
    throw new RangeError("secret must contain at least 16 characters");
  }

  const message = new Uint8Array([...utf8Bytes(AVATAR_VERSION), 0, ...utf8Bytes(userId)]);
  return hmacSha256(utf8Bytes(secret), message);
}

export function createAvatarDescriptor(userId, { secret } = {}) {
  return descriptorFromSeed(seedFor(userId, secret));
}

export function generateAvatarSvg(userId, options = {}) {
  return renderAvatarSvg(createAvatarDescriptor(userId, options), options);
}
