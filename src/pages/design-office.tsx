import { Box, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  saveEditedPixels,
  uploadDesignThumbnailToSupabase,
  databaseFetchColors, // Add this correct import
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
import { offsetPixels } from "../utils/pixelUtils";
import { useDesignContext } from "../context/design-context"; // Use DesignContext

const DesignOffice: React.FC = () => {
  const { designs = [], canvases = [] } = useDesignContext(); // Get designs and canvases from context, defaulting to empty arrays
  const [visibleDesigns, setVisibleDesigns] = useState<Design[]>([]);
  const [colors, setColors] = useState<
    { Color: string; color_sort: number | null; color_name: string }[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]); // State to track edited pixels
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Initial setup: set visible designs and layers based on initial data
    if (designs) {
      setVisibleDesigns(designs);
    }
  }, [designs]);

  const fetchColors = async () => {
    try {
      const fetchedColors = await databaseFetchColors(); // Ensure this is imported correctly

      const colorsWithNames = fetchedColors.map((color: any) => ({
        ...color,
        color_name: color.color_name || "Unnamed",
      }));

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
      toast({
        title: "Error",
        description: `Failed to fetch colors: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditStateChange = (
    isEditing: boolean,
    designId: number | null,
  ) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
    setEditedPixels([]); // Clear the editedPixels array when exiting edit mode
    if (isEditing && designId) {
      setVisibleLayers((prevLayers) => [
        ...prevLayers.filter((id) => id !== designId),
        designId,
      ]);
    }
  };

  const handleVisibilityChange = (newVisibleLayers: number[]) => {
    setVisibleLayers(newVisibleLayers);
  };

  const handleSubmitEdit = async (designName: string) => {
    if (!editDesignId) return;

    const currentDesign = designs?.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      const newPixels = offsetPixels(editedPixels, {
        x: currentDesign.x,
        y: currentDesign.y,
      });
      const updatedDesign = await saveEditedPixels(
        currentDesign,
        newPixels,
        designName,
      );

      toast({
        title: "Changes Saved",
        description: `${designName} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      const thumbnailBlob = await createThumbnail(updatedDesign.pixels);
      await uploadDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

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

  const handleSetDesignCanvas = (designId: number, canvasId: number) => {
    const updatedCanvas = canvases?.find((canvas) => canvas.id === canvasId);
    setSelectedCanvas(updatedCanvas || null);
    console.log(
      `Design ${designId} set to canvas ${selectedCanvas?.canvas_name}`,
    );
  };

  const handleSetCanvas = (canvas: Canvas | null) => {
    let canvasDesigns: Design[] = [];
    if (canvas) {
      canvasDesigns = designs?.filter(
        (design) =>
          design.canvas === canvas.id ||
          (isEditing && design.id === editDesignId),
      ) || [];
    } else {
      canvasDesigns = designs?.filter(
        (design) =>
          design.canvas === null || (isEditing && design.id === editDesignId),
      ) || [];
    }

    setSelectedCanvas(canvas);
    setVisibleDesigns(canvasDesigns);
    setVisibleLayers(canvasDesigns.map((design) => design.id));
  };

  const handleResetViewport = () => {
    setVisibleLayers([]);
    setVisibleDesigns(designs || []);
    setSelectedCanvas(null);
  };

  const handleOnDeleted = (designId: number) => {
    setEditDesignId(null);
    setVisibleLayers((prevLayers) =>
      prevLayers.filter((id) => id !== designId),
    );
  };

  useEffect(() => {
    fetchColors();
  }, []);

  if (!designs?.length) {
    return <Spinner size="xl" />;
  }

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
          visibleLayers={visibleLayers}
          colors={colors}
          canvases={canvases || []}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={handleSetCanvas}
          onResetViewport={handleResetViewport}
          editedPixels={editedPixels} // Pass editedPixels to AdvancedViewport
          setEditedPixels={setEditedPixels}
        />
      </Box>
      <Box overflowY="auto">
        <DesignCardsList
          designs={visibleDesigns}
          visibleLayers={visibleLayers}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit} // Pass handleSubmitEdit function
          onSetCanvas={handleSetDesignCanvas}
          onDeleted={handleOnDeleted}
          editedPixels={editedPixels} // Pass editedPixels to DesignCardsList
        />
        <Box h="100px" /> 
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Box>
  );
};

export default DesignOffice;
