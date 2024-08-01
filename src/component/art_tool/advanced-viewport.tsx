import React, { useEffect, useState, useRef } from "react";
import { Box, Grid } from "@chakra-ui/react";
import Viewport from "./viewport";
import { supabase } from "../../api/supabase";
import { databaseFetchPixels } from "../../api/supabase/database";

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
  visibleLayers: string[];
  onUpdatePixels: (pixels: Pixel[]) => void; // Callback for updating pixels
  designName: string; // Pass the design name to ensure correct canvas
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  designName, // Destructure designName
}) => {
  const [colors, setColors] = useState<{ Color: string, color_sort: number | null }[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [filteredPixels, setFilteredPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]); // Temporary storage for edited pixels
  const previousVisibleLayers = useRef<string[]>([]);

  // Fetch colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      const { data, error } = await supabase
        .from("art_tool_colors")
        .select("Color, color_sort")
        .order("color_sort", { ascending: true });
      if (error) {
        console.error("Error fetching colors:", error);
      } else {
        setColors(data);
      }
    };

    fetchColors();

    // Subscribe to color changes in real-time
    const colorSubscription = supabase
      .channel('realtime-art_tool_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_colors' }, (payload) => {
        console.log('Change received!', payload);

        if (payload.eventType === 'INSERT') {
          setColors((prevColors) => [...prevColors, payload.new as { Color: string; color_sort: number | null; }].sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0)));
        } else if (payload.eventType === 'DELETE') {
          setColors((prevColors) =>
            prevColors.filter((color) => color.Color !== payload.old.Color)
          );
        } else if (payload.eventType === 'UPDATE') {
          setColors((prevColors) =>
            prevColors.map((color) =>
              color.Color === payload.old.Color ? payload.new as { Color: string; color_sort: number | null; } : color
            ).sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(colorSubscription);
    };
  }, []);

  // Fetch pixels based on visible layers
  useEffect(() => {
    const layersToFetch = ["main", ...visibleLayers.filter(layer => layer !== "main")];

    if (JSON.stringify(previousVisibleLayers.current) !== JSON.stringify(layersToFetch)) {
      previousVisibleLayers.current = layersToFetch;

      const fetchPixels = async () => {
        if (layersToFetch.length === 0) {
          setPixels([]);
          return;
        }

        const allVisiblePixels = await Promise.all(
          layersToFetch.map(layer => databaseFetchPixels(layer))
        );
        setPixels(allVisiblePixels.flat());
      };

      fetchPixels();
    }
  }, [visibleLayers]);

  // Filter and merge pixels from different layers
  useEffect(() => {
    const pixelMap = new Map<string, Pixel>();

    for (let i = pixels.length - 1; i >= 0; i--) {
      const pixel = pixels[i];
      const key = `${pixel.x}-${pixel.y}`;
      
      if (!pixelMap.has(key)) {
        pixelMap.set(key, pixel);
      }
    }

    setFilteredPixels(Array.from(pixelMap.values()));
  }, [pixels]);

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  // Handle pixel painting
  const handlePixelPaint = (x: number, y: number) => {
    if (!isEditing || !selectedColor) return;

    const newPixel: Pixel = { id: Date.now(), x, y, color: selectedColor, canvas: designName };
    const updatedPixels = [...editedPixels, newPixel];

    setEditedPixels(updatedPixels);
    setFilteredPixels(prev => [...prev, newPixel]);

    onUpdatePixels(updatedPixels); // Pass edited pixels to parent component immediately
  };

  return (
    <Box position="relative" height="100%">
      <Viewport
        designId={editDesignId}
        pixels={filteredPixels}
        isEditing={isEditing}
        onPixelPaint={handlePixelPaint} // Handle pixel painting
      />

      {isEditing && (
        <Box position="absolute" bottom="10px" left="50%" transform="translateX(-50%)" zIndex="100">
          <Grid templateColumns={`repeat(${colors.length}, 1fr)`} gap={2}>
            {colors.map((color) => (
              <Box
                key={color.Color}
                w="30px"
                h="30px"
                bg={color.Color}
                border={selectedColor === color.Color ? "2px solid black" : "1px solid #ccc"}
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
