import { useMemo, useRef, useCallback } from 'react';
import { ViewportPixel } from '../types';

interface PixelMapEntry {
  pixels: ViewportPixel[];
  version: number;
}

export const useOptimizedPixelMap = (pixels: ViewportPixel[]) => {
  const pixelMapRef = useRef<Map<string, PixelMapEntry>>(new Map());
  const lastPixelsVersionRef = useRef<number>(0);
  const pixelsHashRef = useRef<string>('');

  // Create a simple hash of the pixels array to detect changes
  const createPixelsHash = useCallback((pixelArray: ViewportPixel[]): string => {
    // Create a lightweight hash based on array length and a sample of coordinates
    let hash = pixelArray.length.toString();
    const sampleSize = Math.min(10, pixelArray.length);
    for (let i = 0; i < sampleSize; i++) {
      const pixel = pixelArray[i];
      hash += `${pixel.x},${pixel.y},${pixel.designId}`;
    }
    return hash;
  }, []);

  const pixelMap = useMemo(() => {
    const currentHash = createPixelsHash(pixels);
    
    // If hash hasn't changed, return existing map
    if (currentHash === pixelsHashRef.current && pixelMapRef.current.size > 0) {
      return pixelMapRef.current;
    }

    // Hash changed, we need to update the map
    pixelsHashRef.current = currentHash;
    lastPixelsVersionRef.current++;
    const currentVersion = lastPixelsVersionRef.current;

    // Check if this is a small change (add/remove few pixels) vs major change
    const sizeDiff = Math.abs(pixels.length - pixelMapRef.current.size);
    const isMinorChange = sizeDiff <= 10 && pixelMapRef.current.size > 0;

    if (isMinorChange) {
      // Incremental update for small changes
      const newMap = new Map(pixelMapRef.current);
      
      // Create a set of current pixel keys for quick lookup
      const currentPixelKeys = new Set<string>();
      
      // Update or add new pixels
      for (const pixel of pixels) {
        const key = `${pixel.x} - ${pixel.y}`;
        currentPixelKeys.add(key);
        
        const existing = newMap.get(key);
        if (!existing || existing.version < currentVersion) {
          // Find all pixels at this coordinate
          const pixelsAtCoord = pixels.filter(p => p.x === pixel.x && p.y === pixel.y);
          newMap.set(key, {
            pixels: pixelsAtCoord,
            version: currentVersion
          });
        }
      }
      
      // Remove pixels that no longer exist
      for (const [key] of newMap.entries()) {
        if (!currentPixelKeys.has(key)) {
          newMap.delete(key);
        }
      }
      
      pixelMapRef.current = newMap;
      return newMap;
    } else {
      // Full recreation for major changes
      const newMap = new Map<string, PixelMapEntry>();
      
      for (const pixel of pixels) {
        const key = `${pixel.x} - ${pixel.y}`;
        if (!newMap.has(key)) {
          newMap.set(key, {
            pixels: [],
            version: currentVersion
          });
        }
        newMap.get(key)!.pixels.push(pixel);
      }
      
      pixelMapRef.current = newMap;
      return newMap;
    }
  }, [pixels, createPixelsHash]);

  // Return map in the format expected by existing code
  const compatiblePixelMap = useMemo(() => {
    const compatMap = new Map<string, ViewportPixel[]>();
    pixelMap.forEach((entry, key) => {
      compatMap.set(key, entry.pixels);
    });
    return compatMap;
  }, [pixelMap]);

  return compatiblePixelMap;
};