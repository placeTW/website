// src/component/art_tool/export-canvas.tsx

import React, { useState } from 'react';
import { Box, Button, Text, useToast } from '@chakra-ui/react';
import {
  databaseFetchCanvas,
  databaseFetchDesigns,
} from '../../api/supabase/database';
import { Canvas, Design } from '../../types/art-tool';
import { supabase } from '../../api/supabase';
import { CLEAR_ON_DESIGN } from '../viewport/constants';

interface ExportPixel {
    x: number;
    y: number;
    color: string;
  }

const ExportCanvas: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch the main canvas (replace with your actual canvas ID)
      const canvasId = 1; // Assuming '1' is the ID of the main canvas
      const canvas: Canvas | null = await databaseFetchCanvas(canvasId);

      if (!canvas) {
        toast({
          title: 'Error',
          description: 'Main canvas not found.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      // Fetch all designs on the canvas
      const designs: Design[] | null = await databaseFetchDesigns(canvasId);

      if (!designs || designs.length === 0) {
        toast({
          title: 'Error',
          description: 'No designs found on the main canvas.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      // Order the designs by the canvas layer order
      const designsMap = new Map(designs.map(obj => [obj.id, obj]));

      const orderedDesigns = canvas.layer_order
        .map(id => designsMap.get(id))
        .filter(design => design !== undefined);

      designs.forEach((design) => !orderedDesigns.includes(design) && orderedDesigns.push(design))

      // Define an interface for the pixels we will work with
      interface ExportPixel {
        x: number;
        y: number;
        color: string;
      }

      // Combine all designs' pixels into one array
      let combinedPixels: ExportPixel[] = [];

      designs.forEach((design) => {
        // Offset the design's pixels by its x and y coordinates
        const offsettedPixels: ExportPixel[] = design.pixels.map((pixel) => ({
          x: pixel.x + design.x,
          y: pixel.y + design.y,
          color: pixel.color,
        }));
        combinedPixels = combinedPixels.concat(offsettedPixels);
      });

      // Remove any pixels that are clear
      combinedPixels = combinedPixels.filter(
        (pixel) => pixel.color !== CLEAR_ON_DESIGN
      );

      // If no pixels, show error
      if (combinedPixels.length === 0) {
        toast({
          title: 'Error',
          description: 'No pixels to export.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      // Get the top-left coordinates of the combined pixels
      const topLeftCoords = getTopLeftCoords(combinedPixels);

      // Offset the pixels to start from (0,0)
      const pixelsToExport = offsetPixels(combinedPixels, topLeftCoords);

      // Get the width and height of the cropped area
      const maxX = Math.max(...pixelsToExport.map((pixel) => pixel.x));
      const maxY = Math.max(...pixelsToExport.map((pixel) => pixel.y));

      const width = maxX + 1;
      const height = maxY + 1;

      // Create a canvas and draw the pixels
      const canvasElement = document.createElement('canvas');
      canvasElement.width = width;
      canvasElement.height = height;
      const ctx = canvasElement.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context.');
      }

      // Fill the canvas with transparent pixels
      ctx.clearRect(0, 0, width, height);

      // Draw each pixel
      pixelsToExport.forEach((pixel) => {
        ctx.fillStyle = pixel.color; // Assuming color is in a Canvas-compatible format
        ctx.fillRect(pixel.x, pixel.y, 1, 1);
      });

      // Convert canvas to Blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvasElement.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/png');
      });

      // Upload the Blob to Supabase storage
      const filename = `${new Date().toISOString()}-canvas_export_x${topLeftCoords.x}_y${topLeftCoords.y}.png`;
      const { error } = await supabase.storage
        .from('canvas-exports')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Canvas exported successfully. File saved as ${filename}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting canvas:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while exporting the canvas.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Utility functions for processing pixels
  // These functions accept ExportPixel[] instead of Pixel[]
  const getTopLeftCoords = (pixels: ExportPixel[]) => {
    const minX = Math.min(...pixels.map((pixel) => pixel.x));
    const minY = Math.min(...pixels.map((pixel) => pixel.y));
    return { x: minX, y: minY };
  };

  const offsetPixels = (
    pixels: ExportPixel[],
    offset: { x: number; y: number }
  ) => {
    return pixels.map((pixel) => ({
      x: pixel.x - offset.x,
      y: pixel.y - offset.y,
      color: pixel.color,
    }));
  };

  return (
    <Box mt={4}>
      <Text fontSize="xl" fontWeight="bold" mb={2}>
        Export Canvas
      </Text>
      <Button colorScheme="blue" onClick={handleExport} isLoading={isExporting}>
        Export Main Canvas
      </Button>
    </Box>
  );
};

export default ExportCanvas;
