import React, { useEffect, useState } from "react";
import { Box, Grid } from "@chakra-ui/react";
import Viewport from "./viewport";
import { supabase } from "../../api/supabase";

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({ isEditing, editDesignId }) => {
  const [colors, setColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial colors from Supabase
    const fetchColors = async () => {
      const { data, error } = await supabase.from("art_tool_colors").select("*");
      if (error) {
        console.error("Error fetching colors:", error);
      } else {
        setColors(data.map((color) => color.Color));
      }
    };

    fetchColors();

    // Set up real-time subscription for color changes
    const colorSubscription = supabase
      .channel('realtime-art_tool_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_colors' }, (payload) => {
        console.log('Change received!', payload);

        if (payload.eventType === 'INSERT') {
          setColors((prevColors) => [...prevColors, payload.new.Color]);
        } else if (payload.eventType === 'DELETE') {
          setColors((prevColors) =>
            prevColors.filter((color) => color !== payload.old.Color)
          );
        } else if (payload.eventType === 'UPDATE') {
          setColors((prevColors) =>
            prevColors.map((color) =>
              color === payload.old.Color ? payload.new.Color : color
            )
          );
        }
      })
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(colorSubscription);
    };
  }, []);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Do something with the selected color (e.g., update design)
  };

  return (
    <Box position="relative" height="100%">
      {/* Keep the existing Viewport */}
      <Viewport designId={editDesignId} />

      {/* Conditionally render the color palette */}
      {isEditing && (
        <Box position="absolute" bottom="10px" left="10px" zIndex="100">
          <Grid templateColumns="repeat(6, 1fr)" gap={2}>
            {colors.map((color) => (
              <Box
                key={color}
                w="30px"
                h="30px"
                bg={color}
                border={selectedColor === color ? "2px solid black" : "1px solid #ccc"}
                cursor="pointer"
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedViewport;
