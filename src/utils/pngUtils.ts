export interface PngPixel {
  x: number;
  y: number;
  color: string;
}

export interface ExtractedColor {
  color: string;
  count: number;
  sample: { x: number; y: number };
}

/**
 * Converts RGB values to hex color string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Extract image data from a PNG file
 */
export const extractPngData = (file: File): Promise<{
  imageData: ImageData;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({
        imageData,
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Extract unique colors from PNG image data
 */
export const extractColors = (imageData: ImageData): ExtractedColor[] => {
  const colorMap = new Map<string, { count: number; sample: { x: number; y: number } }>();
  const { data, width } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a === 0) continue;

    const hex = rgbToHex(r, g, b);
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (!colorMap.has(hex)) {
      colorMap.set(hex, { count: 1, sample: { x, y } });
    } else {
      const existing = colorMap.get(hex)!;
      existing.count++;
    }
  }

  return Array.from(colorMap.entries())
    .map(([color, { count, sample }]) => ({ color, count, sample }))
    .sort((a, b) => b.count - a.count); // Sort by frequency
};

/**
 * Convert PNG image data to pixel array
 */
export const convertToPixels = (
  imageData: ImageData,
  colorMapping: Map<string, string>
): PngPixel[] => {
  const pixels: PngPixel[] = [];
  const { data, width } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a === 0) continue;

    const originalColor = rgbToHex(r, g, b);
    const mappedColor = colorMapping.get(originalColor);

    if (mappedColor) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      pixels.push({
        x,
        y,
        color: mappedColor,
      });
    }
  }

  return pixels;
};

/**
 * Calculate color difference using simple RGB distance
 */
export const calculateColorDistance = (color1: string, color2: string): number => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + 
    Math.pow(g2 - g1, 2) + 
    Math.pow(b2 - b1, 2)
  );
};

/**
 * Auto-suggest color mappings based on similarity
 */
export const suggestColorMappings = (
  pngColors: ExtractedColor[],
  availableColors: { Color: string; color_name: string }[]
): Map<string, string> => {
  const mappings = new Map<string, string>();

  pngColors.forEach(({ color: pngColor }) => {
    let bestMatch = availableColors[0];
    let bestDistance = calculateColorDistance(pngColor, availableColors[0].Color);

    availableColors.forEach(availableColor => {
      const distance = calculateColorDistance(pngColor, availableColor.Color);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = availableColor;
      }
    });

    mappings.set(pngColor, bestMatch.Color);
  });

  return mappings;
};