export async function convertToPaa(imageDataUrl: string): Promise<Uint8Array> {
  const img = await loadImage(imageDataUrl);
  const w = img.width;
  const h = img.height;

  if (!isPow2(w) || !isPow2(h) || w < 4 || h < 4 || w > 4096 || h > 4096) {
    throw new Error(
      `Dimensões inválidas: ${w}x${h}. Ambas devem ser potência de 2 (ex: 64x64, 128x256, 512x1024).`
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  let hasAlpha = false;
  let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
  let maxR = 0, maxG = 0, maxB = 0, maxA = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a < 255) hasAlpha = true;
    sumR += r; sumG += g; sumB += b; sumA += a;
    if (r > maxR) maxR = r;
    if (g > maxG) maxG = g;
    if (b > maxB) maxB = b;
    if (a > maxA) maxA = a;
  }

  const numPixels = w * h;
  const avgColor = ((sumA / numPixels) << 24 | (sumR / numPixels) << 16 | (sumG / numPixels) << 8 | (sumB / numPixels)) >>> 0;
  const maxColor = (maxA << 24 | maxR << 16 | maxG << 8 | maxB) >>> 0;

  const type = hasAlpha ? 0xFF05 : 0xFF01;
  const blockSize = hasAlpha ? 16 : 8;

  const mipmaps = generateMipmaps(new Uint8Array(pixels), w, h);

  let totalSize = 48;
  for (const mip of mipmaps) {
    const numBlocksX = Math.ceil(mip.w / 4);
    const numBlocksY = Math.ceil(mip.h / 4);
    const dataSize = numBlocksX * numBlocksY * blockSize;
    totalSize += 7 + dataSize;
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, type, true); offset += 2;

  writeString(view, offset, 'CGVA\0\0\0\0'); offset += 8;
  view.setUint32(offset, 4, true); offset += 4;
  view.setUint32(offset, avgColor, true); offset += 4;

  writeString(view, offset, 'MAXC\0\0\0\0'); offset += 8;
  view.setUint32(offset, 4, true); offset += 4;
  view.setUint32(offset, maxColor, true); offset += 4;

  view.setUint16(offset, 0, true); offset += 2;

  for (const mip of mipmaps) {
    const numBlocksX = Math.ceil(mip.w / 4);
    const numBlocksY = Math.ceil(mip.h / 4);
    const dataSize = numBlocksX * numBlocksY * blockSize;

    view.setUint16(offset, mip.w, true); offset += 2;
    view.setUint16(offset, mip.h, true); offset += 2;
    view.setUint8(offset, dataSize & 0xFF); offset += 1;
    view.setUint8(offset, (dataSize >> 8) & 0xFF); offset += 1;
    view.setUint8(offset, (dataSize >> 16) & 0xFF); offset += 1;

    const compressedData = hasAlpha
      ? compressDxt5(mip.data, mip.w, mip.h)
      : compressDxt1(mip.data, mip.w, mip.h);

    new Uint8Array(buffer, offset, compressedData.length).set(compressedData);
    offset += compressedData.length;
  }

  return new Uint8Array(buffer);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function isPow2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function generateMipmaps(pixels: Uint8Array, w: number, h: number): Array<{ w: number; h: number; data: Uint8Array }> {
  const mipmaps: Array<{ w: number; h: number; data: Uint8Array }> = [{ w, h, data: pixels }];

  while (w > 1 || h > 1) {
    const newW = Math.max(1, w >> 1);
    const newH = Math.max(1, h >> 1);
    const src = mipmaps[mipmaps.length - 1].data;
    const dst = new Uint8Array(newW * newH * 4);

    if (newW === 1 && newH === 1) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          sumR += src[idx]; sumG += src[idx + 1]; sumB += src[idx + 2]; sumA += src[idx + 3];
          count++;
        }
      }
      dst[0] = Math.round(sumR / count);
      dst[1] = Math.round(sumG / count);
      dst[2] = Math.round(sumB / count);
      dst[3] = Math.round(sumA / count);
    } else {
      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const srcY = Math.min(y * 2, h - 1);
          const srcX = Math.min(x * 2, w - 1);
          const dstIdx = (y * newW + x) * 4;

          const y0 = srcY;
          const y1 = Math.min(srcY + 1, h - 1);
          const x0 = srcX;
          const x1 = Math.min(srcX + 1, w - 1);

          for (let c = 0; c < 4; c++) {
            const v = (
              src[(y0 * w + x0) * 4 + c] +
              src[(y0 * w + x1) * 4 + c] +
              src[(y1 * w + x0) * 4 + c] +
              src[(y1 * w + x1) * 4 + c]
            );
            dst[dstIdx + c] = v >> 2;
          }
        }
      }
    }

    w = newW;
    h = newH;
    mipmaps.push({ w, h, data: dst });
  }

  return mipmaps;
}

function compressDxt1(pixels: Uint8Array, w: number, h: number): Uint8Array {
  const numBlocksX = Math.ceil(w / 4);
  const numBlocksY = Math.ceil(h / 4);
  const output = new Uint8Array(numBlocksX * numBlocksY * 8);

  for (let by = 0; by < numBlocksY; by++) {
    for (let bx = 0; bx < numBlocksX; bx++) {
      const block = extractBlock(pixels, w, h, bx * 4, by * 4);
      const encoded = encodeDxt1Block(block);
      const blockIdx = (by * numBlocksX + bx) * 8;
      output.set(encoded, blockIdx);
    }
  }

  return output;
}

function compressDxt5(pixels: Uint8Array, w: number, h: number): Uint8Array {
  const numBlocksX = Math.ceil(w / 4);
  const numBlocksY = Math.ceil(h / 4);
  const output = new Uint8Array(numBlocksX * numBlocksY * 16);

  for (let by = 0; by < numBlocksY; by++) {
    for (let bx = 0; bx < numBlocksX; bx++) {
      const block = extractBlock(pixels, w, h, bx * 4, by * 4);
      const alphaBlock = encodeDxt5Alpha(block);
      const colorBlock = encodeDxt1Block(block);
      const blockIdx = (by * numBlocksX + bx) * 16;
      output.set(alphaBlock, blockIdx);
      output.set(colorBlock, blockIdx + 8);
    }
  }

  return output;
}

function extractBlock(pixels: Uint8Array, imgW: number, imgH: number, startX: number, startY: number): Uint8Array {
  const block = new Uint8Array(64);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = Math.min(startX + x, imgW - 1);
      const py = Math.min(startY + y, imgH - 1);
      const srcIdx = (py * imgW + px) * 4;
      const dstIdx = (y * 4 + x) * 4;
      block[dstIdx] = pixels[srcIdx];
      block[dstIdx + 1] = pixels[srcIdx + 1];
      block[dstIdx + 2] = pixels[srcIdx + 2];
      block[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  return block;
}

function encodeDxt1Block(pixels: Uint8Array): Uint8Array {
  let minR = 255, minG = 255, minB = 255;
  let maxR = 0, maxG = 0, maxB = 0;

  for (let i = 0; i < 16; i++) {
    const r = pixels[i * 4], g = pixels[i * 4 + 1], b = pixels[i * 4 + 2];
    if (r < minR) minR = r;
    if (g < minG) minG = g;
    if (b < minB) minB = b;
    if (r > maxR) maxR = r;
    if (g > maxG) maxG = g;
    if (b > maxB) maxB = b;
  }

  const c0 = pack565(maxR, maxG, maxB);
  const c1 = pack565(minR, minG, minB);

  const use4Color = c0 >= c1;
  const color0 = use4Color ? c0 : c1;
  const color1 = use4Color ? c1 : c0;

  const col0 = expand565(color0);
  const col1 = expand565(color1);

  const colors: Array<[number, number, number]> = [
    col0,
    col1,
    [
      (2 * col0[0] + col1[0]) / 3,
      (2 * col0[1] + col1[1]) / 3,
      (2 * col0[2] + col1[2]) / 3,
    ],
    [
      (col0[0] + 2 * col1[0]) / 3,
      (col0[1] + 2 * col1[1]) / 3,
      (col0[2] + 2 * col1[2]) / 3,
    ],
  ];

  const output = new Uint8Array(8);
  output[0] = color0 & 0xFF;
  output[1] = (color0 >> 8) & 0xFF;
  output[2] = color1 & 0xFF;
  output[3] = (color1 >> 8) & 0xFF;

  for (let row = 0; row < 4; row++) {
    let byteVal = 0;
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const r = pixels[idx * 4], g = pixels[idx * 4 + 1], b = pixels[idx * 4 + 2];

      let bestDist = Infinity;
      let bestIdx = 0;
      for (let ci = 0; ci < 4; ci++) {
        const dr = r - colors[ci][0];
        const dg = g - colors[ci][1];
        const db = b - colors[ci][2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = ci;
        }
      }

      byteVal |= bestIdx << (col * 2);
    }
    output[4 + row] = byteVal;
  }

  return output;
}

function encodeDxt5Alpha(pixels: Uint8Array): Uint8Array {
  let minA = 255, maxA = 0;
  for (let i = 0; i < 16; i++) {
    const a = pixels[i * 4 + 3];
    if (a < minA) minA = a;
    if (a > maxA) maxA = a;
  }

  const alpha0 = maxA;
  const alpha1 = minA;

  const alphas: number[] = [alpha0, alpha1];
  for (let i = 2; i < 8; i++) {
    alphas[i] = Math.round(((8 - i) * alpha0 + (i - 1) * alpha1) / 7);
  }

  const indices = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const a = pixels[i * 4 + 3];
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let j = 0; j < 8; j++) {
      const dist = Math.abs(a - alphas[j]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    indices[i] = bestIdx;
  }

  const output = new Uint8Array(8);
  output[0] = alpha0;
  output[1] = alpha1;

  let bits = 0n;
  for (let i = 0; i < 16; i++) {
    bits |= BigInt(indices[i]) << BigInt(i * 3);
  }
  for (let i = 0; i < 6; i++) {
    output[2 + i] = Number((bits >> BigInt(i * 8)) & 0xFFn);
  }

  return output;
}

function pack565(r: number, g: number, b: number): number {
  const r5 = Math.round(r / 255 * 31);
  const g6 = Math.round(g / 255 * 63);
  const b5 = Math.round(b / 255 * 31);
  return (r5 << 11) | (g6 << 5) | b5;
}

function expand565(c: number): [number, number, number] {
  const r5 = (c >> 11) & 0x1F;
  const g6 = (c >> 5) & 0x3F;
  const b5 = c & 0x1F;
  return [
    (r5 << 3) | (r5 >> 2),
    (g6 << 2) | (g6 >> 4),
    (b5 << 3) | (b5 >> 2),
  ];
}
