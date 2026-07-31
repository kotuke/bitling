import assert from "node:assert/strict";
import test from "node:test";

import * as browser from "../src/browser.mjs";
import * as node from "../src/avatar.mjs";

const SECRET = "browser-test-secret-at-least-16-characters";

test("the browser entry point produces byte-identical SVG", () => {
  for (let index = 0; index < 100; index += 1) {
    const userId = `browser-${index}`;
    assert.equal(
      browser.generateAvatarSvg(userId, { secret: SECRET, size: 128 }),
      node.generateAvatarSvg(userId, { secret: SECRET, size: 128 }),
    );
  }
});

test("the browser seed matches the Node HMAC", () => {
  const fromBrowser = browser.createAvatarDescriptor("seed-user", { secret: SECRET });
  const fromNode = node.createAvatarDescriptor("seed-user", { secret: SECRET });
  assert.equal(fromBrowser.fingerprint, fromNode.fingerprint);
  assert.equal(fromBrowser.accent, fromNode.accent);
});

test("the browser entry point validates input the same way", () => {
  assert.throws(() => browser.generateAvatarSvg("", { secret: SECRET }), /userId/);
  assert.throws(() => browser.generateAvatarSvg("user", { secret: "short" }), /16 characters/);
});
