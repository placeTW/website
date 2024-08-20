import { Box, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  saveEditedPixels,
  uploadDesignThumbnailToSupabase,
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
} from "../component/viewport/constants";
import { Canvas, Pixel } from "../types/art-tool";
import { createThumbnail } from "../utils/imageUtils";
import { offsetPixels } from "../utils/pixelUtils";
import { useDesignContext } from "../context/design-context";
import { useColorContext } from "../context/color-context";

const DesignOffice: React.FC = () => {
  const { designs, canvases } = useDesignContext();
  const { colors } = useColorContext();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const toast = useToast();

  useEffect(() => {
    console.log("[DESIGN OFFICE] Designs updated:", designs);
    if (colors && designs) {
      setLoading(false);
    }
  }, [colors, designs]);

  const handleEditStateChange = (
    isEditing: boolean,
    designId: number | null
  ) => {
    console.log("[DESIGN OFFICE] Edit state changed:", { isEditing, designId });
    setIsEditing(isEditing);
    setEditDesignId(designId);
    setEditedPixels([]);
    if (isEditing && designId) {
      setVisibleLayers((prevLayers) => [
        ...prevLayers.filter((id) => id !== designId),
        designId,
      ]);
    }
  };

  const handleVisibilityChange = (newVisibleLayers: number[]) => {
    console.log("[DESIGN OFFICE] Visibility layers changed:", newVisibleLayers);
    setVisibleLayers(newVisibleLayers);
  };

  const handleSubmitEdit = async (designName: string) => {
    if (!editDesignId) return;

    const currentDesign = designs?.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      console.log("[DESIGN OFFICE] Submitting edit for design:", currentDesign);
      const newPixels = offsetPixels(editedPixels, {
        x: currentDesign.x,
        y: currentDesign.y,
      });
      const updatedDesign = await saveEditedPixels(
        currentDesign,
        newPixels,
        designName
      );

      const thumbnailBlob = await createThumbnail(updatedDesign.pixels);
      await uploadDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

      toast({
        title: "Changes Saved",
        description: `${designName} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

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

  const handleSetCanvas = (designId: number, canvasId: number) => {
    console.log("[DESIGN OFFICE] Setting canvas:", { designId, canvasId });
    const updatedDesigns = designs?.map((design) => {
      if (design.id === designId) {
        return { ...design, canvas: canvasId };
      }
      return design;
    });

    setSelectedCanvas(
      canvases?.find((canvas) => canvas.id === canvasId) || null
    );

    setVisibleLayers(
      updatedDesigns
        ?.filter((design) => design.canvas === canvasId)
        .map((design) => design.id) || []
    );
  };

  const handleResetViewport = () => {
    console.log("[DESIGN OFFICE] Resetting viewport");
    setVisibleLayers([]);
    setSelectedCanvas(null);
  };

  const handleOnDeleted = (designId: number) => {
    console.log("[DESIGN OFFICE] Design deleted:", designId);
    setEditDesignId(null);
    setVisibleLayers((prevLayers) =>
      prevLayers.filter((id) => id !== designId)
    );
  };

  if (loading) {
    return <Spinner size="xl" />;
  }

  const allColors = [
    ...(colors || []),
    {
      Color: CLEAR_ON_DESIGN,
      color_sort: null,
      color_name: "Clear on Design",
    },
    {
      Color: CLEAR_ON_MAIN,
      color_sort: null,
      color_name: "Clear on Main",
    },
  ];

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
          colors={allColors}
          canvases={canvases || []}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={(canvas) =>
            handleSetCanvas(editDesignId || 0, canvas?.id || 0)
          }
          onResetViewport={handleResetViewport}
          editedPixels={editedPixels}
          setEditedPixels={setEditedPixels}
        />
      </Box>
      <Box overflowY="auto">
        <DesignCardsList
          designs={designs || []}
          visibleLayers={visibleLayers}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit}
          onSetCanvas={handleSetCanvas}
          onDeleted={handleOnDeleted}
          editedPixels={editedPixels}
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
