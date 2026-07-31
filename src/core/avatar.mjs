import { toHex } from "../internal/sha256.mjs";

export const AVATAR_VERSION = "v1";
export const DEFAULT_SIZE = 256;
export const MIN_SIZE = 32;
export const MAX_SIZE = 2048;

export const PALETTE = Object.freeze([
  "#FF9B3D",
  "#43C7E8",
  "#9B7BFF",
  "#FFD34E",
  "#49D17D",
  "#FF6B57",
  "#5B8CFF",
  "#2EC4B6",
  "#70D98B",
  "#E85D75",
  "#F15BB5",
  "#4CC9F0",
]);

const CANVAS = 1254;
const BACKGROUND_GRID = 66;
const MODULE_STEP = 33;
const MODULE_SIZE = 26;
const HALF_MODULE = MODULE_SIZE / 2;
const CENTER_X = CANVAS / 2;
const SIGIL_ORIGIN_Y = 231;
const ROBOT_ORIGIN_Y = 660;

const BACKGROUND = "#080A0E";
const GRID = "#20242B";
const ROBOT = "#F4F1E7";

const ROBOT_WHITE = Object.freeze([
  [-1, 0], [0, 0], [1, 0],
  [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
  [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2],
  [-4, 3], [-3, 3], [-2, 3], [0, 3], [2, 3], [3, 3], [4, 3],
  [-5, 4], [-4, 4], [-3, 4], [-2, 4], [-1, 4], [0, 4],
  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
  [-5, 5], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 5], [2, 5], [3, 5], [5, 5],
  [-3, 6], [-2, 6], [2, 6], [3, 6],
  [-3, 7], [3, 7],
  [-4, 8], [-3, 8], [3, 8], [4, 8],
]);

const ROBOT_EYES = Object.freeze([[-1, 3], [1, 3]]);

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

export function normalizeSize(value = DEFAULT_SIZE) {
  const size = Number(value);
  if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
    throw new RangeError(`size must be an integer from ${MIN_SIZE} to ${MAX_SIZE}`);
  }
  return size;
}

function pixelKey(column, row) {
  return `${column},${row}`;
}

function addPixel(pixels, column, row) {
  pixels.add(pixelKey(column, row));
}

function addPair(pixels, radius, row) {
  addPixel(pixels, -radius, row);
  addPixel(pixels, radius, row);
}

function decodePixels(pixels) {
  return [...pixels]
    .map((pixel) => pixel.split(",").map(Number))
    .sort(([columnA, rowA], [columnB, rowB]) => rowA - rowB || columnA - columnB);
}

function generateSigilPixels(seed) {
  const rowCount = 10;
  const radii = [1 + (seed[1] % 3)];

  for (let row = 1; row < rowCount; row += 1) {
    const delta = (seed[1 + row] % 3) - 1;
    radii.push(Math.max(1, Math.min(5, radii[row - 1] + delta)));
  }

  const bandRow = 1 + (seed[11] % (rowCount - 2));
  const bandRadius = Math.max(radii[bandRow], 3 + (seed[12] % 3));

  const pixels = new Set();

  for (let row = 0; row < rowCount; row += 1) {
    const radius = radii[row];
    const thickness = seed[13 + row] % (radius + 1);
    const innerRadius = Math.max(0, radius - thickness);
    for (let current = radius; current >= innerRadius; current -= 1) {
      if (current === 0) {
        addPixel(pixels, 0, row);
      } else {
        addPair(pixels, current, row);
      }
    }
  }

  for (let column = -bandRadius; column <= bandRadius; column += 1) {
    addPixel(pixels, column, bandRow);
  }

  return decodePixels(pixels);
}

function assertConnected(pixels) {
  const remaining = new Set(pixels.map(([column, row]) => pixelKey(column, row)));
  const [first] = remaining;
  const queue = [first];
  remaining.delete(first);

  while (queue.length > 0) {
    const current = queue.shift();
    const [column, row] = current.split(",").map(Number);

    for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
      for (let deltaColumn = -1; deltaColumn <= 1; deltaColumn += 1) {
        if (deltaColumn === 0 && deltaRow === 0) continue;
        const neighbor = pixelKey(column + deltaColumn, row + deltaRow);
        if (remaining.delete(neighbor)) queue.push(neighbor);
      }
    }
  }

  if (remaining.size !== 0) {
    throw new Error("generated sigil must be a single connected shape");
  }
}

export function assertAvatarDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    throw new TypeError("descriptor must be an object");
  }

  if (descriptor.version !== AVATAR_VERSION) {
    throw new Error("descriptor uses an unsupported avatar version");
  }

  if (
    typeof descriptor.fingerprint !== "string"
    || !/^[0-9a-f]{32}$/.test(descriptor.fingerprint)
  ) {
    throw new Error("descriptor fingerprint must be 128-bit lowercase hex");
  }

  if (!PALETTE.includes(descriptor.accent)) {
    throw new Error("descriptor uses an unknown accent color");
  }

  if (!Array.isArray(descriptor.pixels) || descriptor.pixels.length < 20) {
    throw new Error("descriptor must contain at least 20 sigil pixels");
  }

  const keys = new Set(descriptor.pixels.map(([column, row]) => pixelKey(column, row)));
  const columns = descriptor.pixels.map(([column]) => column);
  const rows = descriptor.pixels.map(([, row]) => row);

  if (min(columns) + max(columns) !== 0) {
    throw new Error("sigil bounds must be centered on the common axis");
  }

  if (min(rows) < 0 || max(rows) > 9) {
    throw new Error("sigil rows exceed their allotted area");
  }

  for (const [column, row] of descriptor.pixels) {
    if (!Number.isInteger(column) || !Number.isInteger(row)) {
      throw new Error("sigil coordinates must be integers");
    }
    if (column !== 0 && !keys.has(pixelKey(-column, row))) {
      throw new Error("sigil must be bilaterally symmetric");
    }
  }

  assertConnected(descriptor.pixels);
  return descriptor;
}

function min(values) {
  return Math.min(...values);
}

function max(values) {
  return Math.max(...values);
}

function position(column, row, originY) {
  return [
    CENTER_X + column * MODULE_STEP - HALF_MODULE,
    originY + row * MODULE_STEP - HALF_MODULE,
  ];
}

function moduleRectangles(pixels, originY) {
  return pixels
    .map(([column, row]) => {
      const [x, y] = position(column, row, originY);
      return `    <rect x="${x}" y="${y}" width="${MODULE_SIZE}" height="${MODULE_SIZE}"/>`;
    })
    .join("\n");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderAvatarSvg(descriptor, { size = DEFAULT_SIZE, title = "Generated pixel bot avatar" } = {}) {
  assertAvatarDescriptor(descriptor);
  size = normalizeSize(size);
  requireNonEmptyString(title, "title");
  const patternId = `grid-${descriptor.fingerprint}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${CANVAS} ${CANVAS}" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(title)}</title>
  <defs>
    <pattern id="${patternId}" width="${BACKGROUND_GRID}" height="${BACKGROUND_GRID}" patternUnits="userSpaceOnUse">
      <path d="M ${BACKGROUND_GRID} 0 H 0 V ${BACKGROUND_GRID}" fill="none" stroke="${GRID}" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="${CANVAS}" height="${CANVAS}" fill="${BACKGROUND}"/>
  <rect width="${CANVAS}" height="${CANVAS}" fill="url(#${patternId})" shape-rendering="crispEdges"/>
  <g fill="${descriptor.accent}" shape-rendering="crispEdges">
${moduleRectangles(descriptor.pixels, SIGIL_ORIGIN_Y)}
${moduleRectangles(ROBOT_EYES, ROBOT_ORIGIN_Y)}
  </g>
  <g fill="${ROBOT}" shape-rendering="crispEdges">
${moduleRectangles(ROBOT_WHITE, ROBOT_ORIGIN_Y)}
  </g>
</svg>
`;
}


/** Builds a descriptor from a ready 32-byte seed: works in Node and in a browser. */
export function descriptorFromSeed(seed) {
  const descriptor = {
    version: AVATAR_VERSION,
    fingerprint: toHex(seed.subarray(0, 16)),
    accent: PALETTE[seed[0] % PALETTE.length],
    pixels: generateSigilPixels(seed),
  };

  assertAvatarDescriptor(descriptor);
  return Object.freeze({
    ...descriptor,
    pixels: Object.freeze(descriptor.pixels.map((pixel) => Object.freeze(pixel))),
  });
}

// Layout constants and helpers the Node-side PNG renderer needs.
export {
  CANVAS,
  BACKGROUND_GRID,
  MODULE_STEP,
  MODULE_SIZE,
  HALF_MODULE,
  CENTER_X,
  BACKGROUND,
  GRID,
  ROBOT,
  ROBOT_WHITE,
  ROBOT_EYES,
  SIGIL_ORIGIN_Y,
  ROBOT_ORIGIN_Y,
  position,
  requireNonEmptyString,
};
