import { Box, Grid } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { databaseFetchDesigns, supabase } from "../../api/supabase";
import { Design } from "../../types/art-tool";
import Viewport from "../viewport/Viewport";
import { CLEAR_ON_DESIGN, CLEAR_ON_MAIN } from "../viewport/constants";
import { Pixel } from "../viewport/types";

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
  visibleLayers: string[];
  onUpdatePixels: (pixels: Pixel[]) => void;
  designName: string | null;
  colors: { Color: string; color_sort: number | null }[];
  canvasId: string; // Add canvasId prop
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  designName,
  colors,
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const previousVisibleLayers = useRef<string[]>([]);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<Pixel[]>([]);

  // Function to create a checkerboard pattern as an HTMLCanvasElement
  const createCheckerboardPattern = (
    color1: string,
    color2: string,
  ): HTMLCanvasElement => {
    const size = 20;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, size, size);
      ctx.fillRect(size, size, size, size);

      ctx.fillStyle = color2;
      ctx.fillRect(size, 0, size, size);
      ctx.fillRect(0, size, size, size);
    }

    return canvas;
  };

  // Generate checkerboard patterns for the special colors
  const clearOnDesignPatternCanvas = createCheckerboardPattern("#eee", "#fff");
  const clearOnMainPatternCanvas = createCheckerboardPattern("#fc7e7e", "#fff"); // Opaque pink and white checkerboard

  const clearOnDesignPattern = clearOnDesignPatternCanvas.toDataURL();
  const clearOnMainPattern = clearOnMainPatternCanvas.toDataURL();

  // Fetch pixels based on visible layers
  useEffect(() => {
    const layersToFetch = [
      "main",
      ...visibleLayers.filter((layer) => layer !== "main"),
    ];

    // Check if visibleLayers has actually changed
    if (
      JSON.stringify(previousVisibleLayers.current) !==
      JSON.stringify(layersToFetch)
    ) {
      previousVisibleLayers.current = layersToFetch;

      const fetchPixels = async () => {
        if (layersToFetch.length === 0) {
          setPixels([]);
          return;
        }

        const designs = await databaseFetchDesigns();

        const allVisiblePixels = await Promise.all(
          layersToFetch.map(async (layer) => {
            const design = designs?.find((d) => d.design_name === layer);
            if (design) {
              return design.pixels.map((pixel: Pixel) => ({
                ...pixel,
                x: pixel.x + design.x,
                y: pixel.y + design.y,
                canvas: layer, // Add the canvas property
              }));
            }
            return [];
          }),
        );

        setPixels(allVisiblePixels.flat());
      };

      fetchPixels();
    }
  }, [visibleLayers]);

  // Real-time subscription to pixel changes
  useEffect(() => {
    const pixelSubscription = supabase
      .channel("realtime-art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        (payload) => {
          setPixels((prevPixels) => {
            if (payload.eventType === "UPDATE") {
              const updatedDesign = payload.new as Design;

              if (updatedDesign.pixels) {
                const updatedPixels = updatedDesign.pixels.map(
                  (pixel: Pixel) => ({
                    ...pixel,
                    x: pixel.x + updatedDesign.x,
                    y: pixel.y + updatedDesign.y,
                    canvas: updatedDesign.design_name, // Add canvas property
                  }),
                );

                // Merge updatedPixels with existing pixels
                const pixelMap = new Map<string, Pixel>();
                prevPixels.forEach((pixel) =>
                  pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel),
                );
                updatedPixels.forEach((pixel: Pixel) =>
                  pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel),
                );
                return Array.from(pixelMap.values());
              } else {
                console.warn(
                  "updatedDesign.pixels is undefined. Skipping update.",
                );
                return prevPixels;
              }
            } else {
              // Handle other event types like INSERT and DELETE
              return prevPixels;
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
  }, []);

  // Merge pixels from different layers with edited pixels for rendering
  useEffect(() => {
    if (isEditing) {
      const pixelMap = new Map<string, Pixel>();

      // Add existing pixels to the map first
      pixels.forEach((pixel) => {
        pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
      });

      // Overwrite with edited pixels (assuming designName is available)
      editedPixels.forEach((pixel) => {
        if (pixel.color !== CLEAR_ON_DESIGN && designName) {
          pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
        } else {
          pixelMap.delete(`${pixel.x}-${pixel.y}-${pixel.canvas}`);
        }
      });

      // Only set pixels if they have actually changed
      const newPixelsArray = Array.from(pixelMap.values());
      if (JSON.stringify(newPixelsArray) !== JSON.stringify(pixels)) {
        setPixels(newPixelsArray);
      }
    }
  }, [editedPixels, isEditing, designName]); // Removed 'pixels' from dependencies

  const layerOrder = ["main"];
  if (editDesignId && isEditing) {
    layerOrder.push(editDesignId);
  }
  layerOrder.push(
    ...visibleLayers.filter(
      (layer) => layer !== "main" && layer !== editDesignId,
    ),
  );

  // Function to regenerate pixels array from scratch
  const regeneratePixels = async () => {
    const layersToFetch = [
      "main",
      ...visibleLayers.filter((layer) => layer !== "main"),
    ];

    if (layersToFetch.length === 0) {
      setPixels([]); // No layers, so empty pixels array
      return;
    }

    const designs = await databaseFetchDesigns();

    const allVisiblePixels = await Promise.all(
      layersToFetch.map(async (layer) => {
        const design = designs?.find((d) => d.design_name === layer);
        if (design) {
          return design.pixels.map((pixel: Pixel) => ({
            ...pixel,
            x: pixel.x + design.x,
            y: pixel.y + design.y,
            canvas: layer,
          }));
        }
        return [];
      }),
    );

    setPixels(allVisiblePixels.flat());
  };

  // Clear edited pixels on submission or exit from edit mode
  useEffect(() => {
    if (!isEditing) {
      setEditedPixels([]);

      regeneratePixels();
    }
  }, [isEditing]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handlePixelPaint = (x: number, y: number) => {
    if (!isEditing || !selectedColor || !designName) return;
    const newPixel: Pixel = { x, y, color: selectedColor, canvas: designName };

    setEditedPixels((prevEditedPixels) => {
      const updatedPixels = prevEditedPixels.filter(
        (p) => !(p.x === x && p.y === y && p.canvas === designName),
      );
      updatedPixels.push(newPixel);
      onUpdatePixels(updatedPixels);
      return updatedPixels;
    });
  };

  // Handle Copy Pixels
  const handleCopy = () => {
    if (selection && pixels) {
      const { x, y, width, height } = selection;
      const selectedPixels = pixels.filter(
        (pixel) =>
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y < y + height,
      );
      setCopyBuffer(selectedPixels);
      console.log("Copied Pixels:", selectedPixels); // Debug log
    }
  };

  // Handle Paste Pixels
  const handlePaste = (pasteX: number, pasteY: number) => {
    if (!isEditing || !designName) return;
    if (copyBuffer.length > 0) {
      const offsetX = pasteX - copyBuffer[0].x;
      const offsetY = pasteY - copyBuffer[0].y;
      const pastedPixels = copyBuffer.map((pixel) => ({
        ...pixel,
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        canvas: designName,
      }));

      console.log("Pasted Pixels:", pastedPixels); // Debug log

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        onUpdatePixels(updatedPixels);
        return updatedPixels;
      });
    }
  };

  return (
    <Box position="relative" height="100%">
      <Box height="100%">
        {/* TODO: Add canvas selector */}
        <Viewport
          designId={editDesignId}
          pixels={pixels}
          isEditing={isEditing}
          onPixelPaint={handlePixelPaint}
          layerOrder={layerOrder}
          onCopy={handleCopy}
          onPaste={handlePaste}
          selection={selection}
          setSelection={setSelection}
        />
      </Box>

      {isEditing && (
        <Box
          position="absolute"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          zIndex="100"
        >
          <Grid templateColumns={`repeat(${colors.length}, 1fr)`} gap={2}>
            {colors.map((color) => (
              <Box
                key={color.Color}
                w="30px"
                h="30px"
                bg={
                  color.Color === CLEAR_ON_DESIGN
                    ? `url(${clearOnDesignPattern})`
                    : color.Color === CLEAR_ON_MAIN
                    ? `url(${clearOnMainPattern})`
                    : color.Color
                }
                border={
                  selectedColor === color.Color
                    ? "2px solid black"
                    : "1px solid #ccc"
                }
                cursor="pointer"
                onClick={() => handleColorSelect(color.Color)}
              />
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedViewport;
