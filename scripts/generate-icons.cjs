// Simple script to generate PWA icons as data-URI PNGs
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for ClinicalScribe
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  <text x="50%" y="38%" dominant-baseline="middle" text-anchor="middle" 
    font-family="system-ui,-apple-system,sans-serif" font-weight="800" 
    font-size="${Math.round(size * 0.28)}" fill="white" letter-spacing="-1">CS</text>
  <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" 
    font-family="system-ui,-apple-system,sans-serif" font-weight="600" 
    font-size="${Math.round(size * 0.09)}" fill="rgba(255,255,255,0.8)">CLINICAL</text>
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.06}" fill="#34d399" opacity="0.9"/>
</svg>`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Write SVG files (can be used directly or converted to PNG)
[192, 512].forEach(size => {
  const svg = createSvg(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg.trim());
  console.log(`Created icon-${size}.svg`);
});

console.log('\nSVG icons created. For PNG conversion, use an online tool or sharp library.');
console.log('For now, the manifest can reference SVG icons or you can convert them manually.');
