/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts dominant colors from an image using a simple quantization approach.
 * @param imageUrl The URL of the image to process.
 * @param count Number of colors to extract.
 * @returns Promise resolving to an array of hex colors.
 */
export async function extractPalette(imageUrl: string, count: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');

      // Resize for performance as per REQ-02
      const scale = Math.min(200 / img.width, 200 / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors: { r: number; g: number; b: number }[] = [];

      for (let i = 0; i < imageData.length; i += 4) {
        colors.push({
          r: imageData[i],
          g: imageData[i + 1],
          b: imageData[i + 2]
        });
      }

      // Simple quantization: Group colors into buckets and pick the most frequent ones
      // In a real app, K-means would be better, but for this demo, we'll use a simplified bucket approach
      const palette = getDominantColors(colors, count);
      resolve(palette);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Simplified quantization algorithm to find dominant colors.
 */
function getDominantColors(pixels: { r: number; g: number; b: number }[], count: number): string[] {
  const buckets: Record<string, number> = {};
  
  // Reduce color space to group similar colors
  const factor = 32; 
  
  pixels.forEach(p => {
    const r = Math.round(p.r / factor) * factor;
    const g = Math.round(p.g / factor) * factor;
    const b = Math.round(p.b / factor) * factor;
    const key = `${r},${g},${b}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const sorted = Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return rgbToHex(r, g, b);
    });

  return sorted;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
