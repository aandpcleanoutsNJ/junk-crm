#!/usr/bin/env node
// Generates the app's PWA/home-screen icons and on-page logo from the
// Junk Helpers brand SVGs in public/brand/. Icons composite the white
// logo onto the brand blue (#007fcd); the on-page logo is a tightly
// cropped navy-on-transparent PNG for use directly on a white background.
//
// Usage: node scripts/generate-icons.mjs
// Requires the `sharp` devDependency (npm install).

import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BRAND_BLUE = "#007fcd";
const WHITE_LOGO_SVG = new URL("../public/brand/junk-helpers-white.svg", import.meta.url);
const NAVY_LOGO_SVG = new URL("../public/brand/junk-helpers-navy.svg", import.meta.url);

async function loadTrimmedLogo(svgUrl) {
  const svg = readFileSync(svgUrl);
  // Render at high density first so downscaling later stays crisp, then trim
  // the transparent padding baked into the source artwork's square canvas.
  return sharp(svg, { density: 300 }).trim().png().toBuffer();
}

async function makeIcon(trimmedLogo, outPath, canvasSize, logoWidthFraction) {
  const targetWidth = Math.round(canvasSize * logoWidthFraction);
  const resizedLogo = await sharp(trimmedLogo)
    .resize({ width: targetWidth, fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(resizedLogo).metadata();
  const left = Math.round((canvasSize - (meta.width ?? targetWidth)) / 2);
  const top = Math.round((canvasSize - (meta.height ?? targetWidth)) / 2);

  const outFile = fileURLToPath(outPath);
  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BRAND_BLUE,
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toFile(outFile);

  console.log("Wrote", outFile);
}

async function main() {
  const whiteLogo = await loadTrimmedLogo(WHITE_LOGO_SVG);

  await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });

  const iconsDir = (name) => new URL(`../public/icons/${name}`, import.meta.url);
  await makeIcon(whiteLogo, iconsDir("icon-192.png"), 192, 0.72);
  await makeIcon(whiteLogo, iconsDir("icon-512.png"), 512, 0.72);
  // Maskable icons need extra safe-zone padding so OS-applied masks don't clip the mark.
  await makeIcon(whiteLogo, iconsDir("icon-512-maskable.png"), 512, 0.55);

  // Browser tab favicon + iOS "Add to Home Screen" icon (Next's file-based
  // icon/apple-icon conventions, colocated with the root layout).
  await makeIcon(whiteLogo, new URL("../src/app/icon.png", import.meta.url), 256, 0.72);
  await makeIcon(whiteLogo, new URL("../src/app/apple-icon.png", import.meta.url), 180, 0.72);

  // Tightly-cropped navy-on-transparent PNG for on-page use (login header,
  // home screen header) where the logo sits directly on a white background.
  const navyLogo = await loadTrimmedLogo(NAVY_LOGO_SVG);
  const navyOut = fileURLToPath(
    new URL("../public/brand/junk-helpers-navy-trimmed.png", import.meta.url)
  );
  await sharp(navyLogo).png().toFile(navyOut);
  console.log("Wrote", navyOut);

  console.log('Done. Icons regenerated from the "JUNK helpers" logo.');
}

main();
