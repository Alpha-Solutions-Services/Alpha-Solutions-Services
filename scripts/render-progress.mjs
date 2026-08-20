#!/usr/bin/env node
/**
 * Renders progress SVGs + the ## Product progress block into README.md
 * from progress.json. Run after editing progress percentages.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "progress.json"), "utf8"));
const assetsDir = join(root, "assets", "progress");
mkdirSync(assetsDir, { recursive: true });

function barColor(pct) {
  if (pct >= 90) return "#22c55e";
  if (pct >= 75) return "#38a3ff";
  if (pct >= 55) return "#f59e0b";
  return "#94a3b8";
}

function svgFor(pct, id) {
  const fill = barColor(pct);
  const w = Math.max(0, Math.min(100, pct));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="18" role="img" aria-label="${pct}% complete">
  <title>${pct}%</title>
  <rect width="220" height="18" rx="9" fill="#1e293b"/>
  <rect width="${(220 * w) / 100}" height="18" rx="9" fill="${fill}"/>
  <text x="110" y="13" text-anchor="middle" fill="#f8fafc" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" font-weight="600">${pct}%</text>
</svg>
`;
}

const rows = data.products.map((p) => {
  writeFileSync(join(assetsDir, `${p.id}.svg`), svgFor(p.percent, p.id));
  const link = p.url
    ? `[${p.name}](${p.url})`
    : `**${p.name}**`;
  const repo = `[\`${p.repo}\`](https://github.com/Alpha-Solutions-Services/${p.repo})`;
  return `| ${link} | ${p.blurb} | ![${p.percent}%](assets/progress/${p.id}.svg) | ${p.status} | ${repo} |`;
});

const block = `<!-- PROGRESS:START -->
## Product progress

Real delivery status across the Alpha product line. Source of truth: [\`progress.json\`](./progress.json) (last updated **${data.updated}**).

| Product | What it is | Progress | Status | Repo |
|---------|------------|----------|--------|------|
${rows.join("\n")}

> Update a percentage in \`progress.json\`, then run \`node scripts/render-progress.mjs\` to refresh the bars and this table.
<!-- PROGRESS:END -->`;

const readmePath = join(root, "README.md");
let readme = readFileSync(readmePath, "utf8");
if (!readme.includes("<!-- PROGRESS:START -->")) {
  throw new Error("README.md missing PROGRESS markers");
}
readme = readme.replace(
  /<!-- PROGRESS:START -->[\s\S]*?<!-- PROGRESS:END -->/,
  block
);
writeFileSync(readmePath, readme);
console.log(`Rendered ${data.products.length} progress bars → README.md`);
