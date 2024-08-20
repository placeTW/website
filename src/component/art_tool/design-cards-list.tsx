import { Box, SimpleGrid, useToast } from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import { Design, Pixel } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: Design[];
  visibleLayers: number[];
  onEditStateChange: (isEditing: boolean, designId: number | null) => void;
  onVisibilityChange: (visibleLayers: number[]) => void;
  onSubmitEdit: (designName: string) => void;
  onSetCanvas: (designId: number, canvasId: number) => void;
  onDeleted: (designId: number) => void;
  editedPixels: Pixel[];
}

const DesignCardsList: FC<DesignCardsListProps> = ({
  designs,
  visibleLayers,
  onEditStateChange,
  onVisibilityChange,
  onSubmitEdit,
  onSetCanvas,
  onDeleted,
  editedPixels,
}) => {
  const [currentlyEditingCardId, setCurrentlyEditingCardId] = useState<number | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>({});
  const toast = useToast();
  const isFirstRender = useRef(true);
  const previousVisibleLayers = useRef<number[]>([]);

  useEffect(() => {
    console.log("[DESIGN CARDS LIST] Designs list updated:", designs);
  }, [designs]);

  const handleEdit = (designId: number): boolean => {
    console.log("[DESIGN CARDS LIST] Edit initiated for design:", designId);
    if (currentlyEditingCardId && currentlyEditingCardId !== designId) {
      toast({
        title: "Edit in Progress",
        description: "You can only edit one card at a time.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setCurrentlyEditingCardId(designId);
    onEditStateChange(true, designId);
    return true;
  };

  const handleCancelEdit = (): boolean => {
    console.log("[DESIGN CARDS LIST] Edit cancelled");
    setCurrentlyEditingCardId(null);
    onEditStateChange(false, null);
    return true;
  };

  const handleToggleVisibility = (designId: number, isVisible: boolean) => {
    console.log("[DESIGN CARDS LIST] Toggling visibility for design:", {
      designId,
      isVisible,
    });
    setVisibilityMap((prev) => {
      const updated = { ...prev };

      if (isVisible) {
        updated[designId] = true;
      } else {
        delete updated[designId];
      }

      return updated;
    });
  };

  const handleOnDeleted = (designId: number) => {
    console.log("[DESIGN CARDS LIST] Design deleted:", designId);
    
    // Call the parent onDeleted function to update the state in DesignOffice
    onDeleted(designId);

    setVisibilityMap((prev) => {
      const updated = { ...prev };
      delete updated[designId];
      return updated;
    });

    setCurrentlyEditingCardId(null);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const newVisibleLayers = Object.keys(visibilityMap)
      .filter((layer) => visibilityMap[Number(layer)])
      .map(Number);

    if (
      JSON.stringify(newVisibleLayers) !==
      JSON.stringify(previousVisibleLayers.current)
    ) {
      previousVisibleLayers.current = newVisibleLayers;
      console.log("[DESIGN CARDS LIST] Visibility layers changed:", newVisibleLayers);
      onVisibilityChange(newVisibleLayers);
    }
  }, [visibilityMap, onVisibilityChange]);

  useEffect(() => {
    console.log("[DESIGN CARDS LIST] Visible layers updated:", visibleLayers);
    const newVisibilityMap: Record<number, boolean> = {};

    visibleLayers.forEach((layer) => {
      newVisibilityMap[layer] = true;
    });

    setVisibilityMap(newVisibilityMap);
  }, [visibleLayers]);

  // Sort designs by the number of likes in descending order
  const sortedDesigns = [...designs].sort(
    (a, b) => b.liked_by.length - a.liked_by.length,
  );

  return (
    <SimpleGrid minChildWidth="300px" spacing="20px" m={4}>
      {sortedDesigns.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            canvasName={design?.art_tool_canvases?.canvas_name ?? ""}
            isEditing={currentlyEditingCardId === design.id}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onToggleVisibility={handleToggleVisibility}
            isVisible={visibilityMap[design.id] ?? false}
            onSubmitEdit={onSubmitEdit}
            onSetCanvas={onSetCanvas}
            onDeleted={handleOnDeleted}
            editedPixels={editedPixels}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DesignCardsList;
