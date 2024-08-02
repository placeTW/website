import { Box, Grid } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../api/supabase";
import { databaseFetchPixels } from "../../api/supabase/database";
import { Pixel } from "../../types/art-tool"; // Import shared Pixel type
import Viewport from "./viewport";

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
  visibleLayers: string[];
  onUpdatePixels: (pixels: Pixel[]) => void;
  designName: string;
  colors: { Color: string; color_sort: number | null }[]; // Add colors prop here
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  designName,
  colors, // Use colors prop here
}) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const previousVisibleLayers = useRef<string[]>([]);

  // Fetch pixels based on visible layers
  useEffect(() => {
    const layersToFetch = [
      "main",
      ...visibleLayers.filter((layer) => layer !== "main"),
    ];

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

        const allVisiblePixels = await Promise.all(
          layersToFetch.map((layer) => databaseFetchPixels(layer)),
        );
        setPixels(allVisiblePixels.flat());
      };

      fetchPixels();
    }
  }, [visibleLayers]);

  // Real-time subscription to pixel changes
  useEffect(() => {
    const pixelSubscription = supabase
      .channel("realtime-art_tool_pixels")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_pixels" },
        (payload) => {
          const { x, y, color, canvas } = payload.new as Pixel;
          const updatedPixel: Pixel = { x, y, color, canvas };

          setPixels((prevPixels) => {
            const pixelMap = new Map<string, Pixel>();

            // Add existing pixels to the map first
            prevPixels.forEach((pixel) => {
              pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
            });

            // Handle the event based on its type
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              pixelMap.set(
                `${updatedPixel.x}-${updatedPixel.y}-${updatedPixel.canvas}`,
                updatedPixel,
              );
            } else if (payload.eventType === "DELETE") {
              pixelMap.delete(
                `${updatedPixel.x}-${updatedPixel.y}-${updatedPixel.canvas}`,
              );
            }

            return Array.from(pixelMap.values());
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
  }, []);

  // Merge pixels from different layers with edited pixels
  useEffect(() => {
    if (isEditing) {
      const pixelMap = new Map<string, Pixel>();

      // Add existing pixels to the map first
      pixels.forEach((pixel) => {
        pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
      });

      // Overwrite with any edited pixels
      editedPixels.forEach((pixel) => {
        pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
      });

      const mergedPixels = Array.from(pixelMap.values());

      if (JSON.stringify(mergedPixels) !== JSON.stringify(pixels)) {
        setPixels(mergedPixels);
      }
    }
  }, [pixels, editedPixels, isEditing]);

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

    const allVisiblePixels = await Promise.all(
      layersToFetch.map((layer) => databaseFetchPixels(layer)),
    );

    // Update pixels state with freshly fetched data
    setPixels(allVisiblePixels.flat());
  };

  // Clear edited pixels on submission or exit from edit mode
  useEffect(() => {
    if (!isEditing) {
      console.log("Exiting edit mode, clearing editedPixels:", editedPixels); // Log before clearing
      setEditedPixels([]); // Clear the edited pixels array when exiting edit mode

      regeneratePixels(); // Regenerate pixels from scratch
    }
  }, [isEditing]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handlePixelPaint = (x: number, y: number) => {
    if (!isEditing || !selectedColor) return;

    const newPixel: Pixel = { x, y, color: selectedColor, canvas: designName };
    const updatedPixels = [...editedPixels, newPixel];

    setEditedPixels(updatedPixels);
    onUpdatePixels(updatedPixels);
  };

  return (
    <Box position="relative" height="100%">
      <Viewport
        designId={editDesignId}
        pixels={pixels}
        isEditing={isEditing}
        onPixelPaint={handlePixelPaint}
      />

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
                bg={color.Color}
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
