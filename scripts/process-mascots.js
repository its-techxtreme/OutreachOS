const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Flood-clear light backgrounds from mascot PNGs, trim, and resize.
 * Run: node scripts/process-mascots.js
 */
async function processMascot(src, dest) {
  const { data, info } = await sharp(src)
    .resize({ width: 900, height: 1200, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const corners = [
    [1, 1],
    [width - 2, 1],
    [1, height - 2],
    [width - 2, height - 2],
  ];
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
  }
  sr /= 4;
  sg /= 4;
  sb /= 4;

  const isBg = (r, g, b) => {
    const dist = Math.hypot(r - sr, g - sg, b - sb);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const nearWhite = luma > 232 && Math.max(r, g, b) - Math.min(r, g, b) < 18;
    return (dist < 48 && luma > 190) || nearWhite;
  };

  const visited = new Uint8Array(width * height);
  const edge = [];
  for (let x = 0; x < width; x++) {
    edge.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    edge.push(y * width, y * width + width - 1);
  }
  const queue = [];
  for (const i of edge) {
    const p = i * 4;
    if (isBg(data[p], data[p + 1], data[p + 2]) && !visited[i]) {
      visited[i] = 1;
      queue.push(i);
    }
  }
  while (queue.length) {
    const i = queue.pop();
    const x = i % width;
    const y = (i / width) | 0;
    data[i * 4 + 3] = 0;
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (visited[ni]) continue;
      const p = ni * 4;
      if (isBg(data[p], data[p + 1], data[p + 2])) {
        visited[ni] = 1;
        queue.push(ni);
      }
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    const toClear = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const p = i * 4;
        if (data[p + 3] === 0) continue;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma < 225) continue;
        let touch = false;
        for (const [nx, ny] of [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ]) {
          if (data[(ny * width + nx) * 4 + 3] === 0) {
            touch = true;
            break;
          }
        }
        if (touch && Math.max(r, g, b) - Math.min(r, g, b) < 22) {
          toClear.push(i);
        }
      }
    }
    for (const i of toClear) data[i * 4 + 3] = 0;
  }

  const buf = await sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .resize({ height: 480, width: 360, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(dest, buf);
  const m = await sharp(buf).metadata();
  console.log(path.basename(dest), `${m.width}x${m.height}`, 'bytes', buf.length);
}

async function main() {
  const assets =
    'C:/Users/notte/.cursor/projects/c-Users-notte-OneDrive-Desktop-Automated-Lead-Management-Outreach-System/assets';
  const out = path.join(__dirname, '..', 'public', 'mascots');
  fs.mkdirSync(out, { recursive: true });
  const map = [
    ['mascot-adventurer-raw.png', 'adventurer.png'],
    ['mascot-fighter-raw.png', 'fighter.png'],
    ['mascot-athlete-raw.png', 'athlete.png'],
    ['mascot-citygirl-raw.png', 'citygirl.png'],
  ];
  for (const [src, dest] of map) {
    await processMascot(path.join(assets, src), path.join(out, dest));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
