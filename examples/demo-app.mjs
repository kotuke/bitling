import { createAvatarDescriptor, renderAvatarSvg } from "./lib/bitling.mjs";

// Public demo secret: everything here runs in the browser, nothing is sent anywhere.
const SECRET = "bitling-public-demo-secret-v1";

const form = document.querySelector("#demo-form");
const input = document.querySelector("#demo-id");
const stage = document.querySelector("#demo-stage");
const meta = document.querySelector("#demo-meta");
const download = document.querySelector("#demo-download");

let objectUrl = null;

function render() {
  const userId = input.value.trim();
  if (userId.length === 0) {
    stage.innerHTML = "";
    meta.textContent = "Type any identifier to see its avatar.";
    download.hidden = true;
    return;
  }

  try {
    const descriptor = createAvatarDescriptor(userId, { secret: SECRET });
    const svg = renderAvatarSvg(descriptor, { size: 320, title: `Avatar for ${userId}` });
    stage.innerHTML = svg;

    const parts = [
      `accent ${descriptor.accent}`,
      `modules ${descriptor.pixels.length}`,
      `fingerprint ${descriptor.fingerprint.slice(0, 12)}…`,
    ];
    meta.textContent = parts.join(" · ");

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download.href = objectUrl;
    download.download = `bitling-${userId.replace(/[^\w.-]+/g, "_")}.svg`;
    download.hidden = false;
  } catch (error) {
    stage.innerHTML = "";
    meta.textContent = error.message;
    download.hidden = true;
  }
}

form.addEventListener("submit", (event) => event.preventDefault());
input.addEventListener("input", render);

document.querySelector("#demo-random").addEventListener("click", () => {
  input.value = `user-${Math.floor(Math.random() * 1_000_000)}`;
  render();
});

input.value = "ada@example.com";
render();
