import { Box, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import {
  databaseFetchCanvases,
  databaseFetchColors,
  databaseFetchDesigns,
  removeSupabaseChannel,
  saveEditedPixels,
  uploaDesignThumbnailToSupabase,
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
} from "../component/viewport/constants";
import { Canvas, Design, Pixel } from "../types/art-tool";
import { createThumbnail } from "../utils/imageUtils";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [colors, setColors] = useState<
    { Color: string; color_sort: number | null; color_name: string }[] // Updated type
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const toast = useToast();

  const fetchDesigns = async () => {
    const data = await databaseFetchDesigns();
    if (data) {
      setDesigns(data);
    }
    setLoading(false);
  };

  const fetchColors = async () => {
    try {
      const fetchedColors = await databaseFetchColors();

      // Add color_name to each color object based on your data structure
      const colorsWithNames = fetchedColors.map((color) => ({
        ...color,
        color_name: color.color_name || "Unnamed", // Add color_name or a fallback name
      }));

      // Append the special colors on the client-side
      const specialColors = [
        {
          Color: CLEAR_ON_DESIGN,
          color_sort: null,
          color_name: "Clear on Design",
        },
        { Color: CLEAR_ON_MAIN, color_sort: null, color_name: "Clear on Main" },
      ];

      setColors([...colorsWithNames, ...specialColors]);
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const handleEditStateChange = (
    isEditing: boolean,
    designId: string | null,
  ) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
  };

  const handleVisibilityChange = (newVisibleLayers: string[]) => {
    setVisibleLayers(newVisibleLayers);
  };

  const handleUpdatePixels = (pixels: Pixel[]) => {
    if (pixels && pixels.length > 0) {
      setEditedPixels(pixels);
    } else {
      setEditedPixels([]); // Ensure state is reset if the array is empty or undefined
    }
  };

  // Function to handle the submission of edited pixels
  const handleSubmitEdit = async () => {
    if (!editDesignId) return;

    const currentDesign = designs.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      // Merge edited pixels with existing ones, with edited ones taking priority
      const existingPixelMap = new Map<string, Pixel>();
      currentDesign.pixels.forEach((pixel) => {
        existingPixelMap.set(`${pixel.x}-${pixel.y}`, pixel);
      });

      editedPixels.forEach((pixel) => {
        if (pixel.color === CLEAR_ON_DESIGN) {
          existingPixelMap.delete(`${pixel.x}-${pixel.y}`);
        } else {
          existingPixelMap.set(`${pixel.x}-${pixel.y}`, pixel);
        }
      });

      const mergedPixels = Array.from(existingPixelMap.values()).filter(
        (pixel) => pixel.color !== CLEAR_ON_DESIGN,
      );

      // Save filtered pixels to the database
      try {
        await saveEditedPixels(currentDesign, mergedPixels);
      } catch (error) {
        console.error("Error saving edited pixels:", error);
        toast({
          title: "Error",
          description: `Failed to save changes: ${
            (error as Error).message || error
          }`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Generate a thumbnail of the current design with filtered pixels
      const thumbnailBlob = await createThumbnail(mergedPixels);
      // Update the design thumbnail in the database and Supabase storage
      await uploaDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

      toast({
        title: "Changes Saved",
        description: `${currentDesign.design_name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Clear the editedPixels array but stay in edit mode
      setEditedPixels([]);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save changes: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchCanvases = async () => {
    const fetchedCanvases = await databaseFetchCanvases();
    if (fetchedCanvases) {
      setCanvases(fetchedCanvases);
      // Optionally set the first canvas as selected if there are canvases
      if (fetchedCanvases.length > 0) {
        setSelectedCanvas(fetchedCanvases[0]);
      }
    } else {
      // Handle error, e.g., show a toast message
    }
  };

  const handleSetCanvas = (designId: string, canvasId: number) => {
    // Update the selectedCanvas state to trigger a re-render of AdvancedViewport
    const updatedCanvas = canvases.find((canvas) => canvas.id === canvasId);
    setSelectedCanvas(updatedCanvas || null);
    console.log(
      `Design ${designId} set to canvas ${selectedCanvas?.canvas_name}`,
    );
  };

  useEffect(() => {
    fetchDesigns();
    fetchColors();
    fetchCanvases(); // Fetch canvases on component mount

    const subscription = supabase
      .channel("art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        () => {
          fetchDesigns();
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(subscription);
    };
  }, []);

  if (loading) {
    return <Spinner size="xl" />;
  }

  const currentDesign = designs.find((d) => d.id === editDesignId);

  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr 350px"
      height="calc(100vh - 80px)"
      overflow="hidden"
      position="relative"
    >
      <Box border="1px solid #ccc" overflow="hidden">
        <AdvancedViewport
          isEditing={isEditing}
          editDesignId={editDesignId}
          visibleLayers={visibleLayers.length > 0 ? visibleLayers : ["main"]}
          onUpdatePixels={handleUpdatePixels}
          designName={currentDesign ? currentDesign.design_name : "main"}
          colors={colors}
          canvasId={""}
        />
      </Box>
      <Box overflowY="auto">
        <DesignCardsList
          designs={designs}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit}
          onSetCanvas={handleSetCanvas}
        />
        <Box h="100px" /> {/* Spacer at the bottom */}
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Box>
  );
};

export default DesignOffice;
