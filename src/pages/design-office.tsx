import {
  Box,
  IconButton,
  Spinner,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaAngleDown, FaAngleUp, FaAngleLeft, FaAngleRight } from "react-icons/fa6"; // Import icons
import {
  saveEditedPixels,
  createThumbnailForDesign,
  databaseUpdateCanvasLayerOrder,
  updateDesignPosition,
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignsPanel from "../component/art_tool/designs-panel";
import { ViewportHandle } from "../component/viewport/types";
import { useColorContext } from "../context/color-context";
import { useDesignContext } from "../context/design-context";
import { Design, Pixel } from "../types/art-tool";
import { getDimensions, offsetPixels } from "../utils/pixelUtils";
import { useUserContext } from "../context/user-context";
import { useTranslation } from "react-i18next";

const DesignOffice: React.FC = () => {
  const { t } = useTranslation();
  const { designs, canvases, canvasesMap, canvasDesignsMap, setDesigns } = useDesignContext();
  const { colors } = useColorContext();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [dragModeDesignId, setDragModeDesignId] = useState<number | null>(null);
  // Store just the ID in state instead of the entire canvas object  
  // Initialize to null and let useEffect handle initial selection when canvases load
  const [selectedCanvasId, setSelectedCanvasId] = useState<number | null>(null);
  // Get the actual canvas directly from the context using useMemo for proper reactivity
  const selectedCanvas = useMemo(() => {
    return selectedCanvasId ? canvasesMap.get(selectedCanvasId) || canvases[0] : canvases[0];
  }, [selectedCanvasId, canvasesMap, canvases]);
  const [isCardListVisible, setIsCardListVisible] = useState(true); // New state for card list visibility
  const [isMobile] = useMediaQuery("(max-width: 768px)"); // Media query for mobile devices
  const advancedViewportRef = useRef<ViewportHandle>(null);
  const designCardsListRef = useRef<HTMLDivElement>(null); // Add a ref for DesignCardsList
  const toast = useToast();
  const {currentUser} = useUserContext();

  useEffect(() => {
    if (colors && designs) {
      setLoading(false);
    }
  }, [colors, designs]);

  // Select the first canvas by default only if none is selected or current selection is invalid
  useEffect(() => {
    if (canvases && canvases.length > 0) {
      // Only select first canvas if:
      // 1. No canvas is currently selected, OR
      // 2. The currently selected canvas no longer exists in the canvases array
      const currentCanvasExists = selectedCanvasId && canvases.some(canvas => canvas.id === selectedCanvasId);
      
      if (!selectedCanvasId || !currentCanvasExists) {
        selectCanvas(canvases[0].id, designs || []);
      }
    }
  }, [canvases, selectedCanvasId, designs]);

  // Hide card list by default on mobile devices
  useEffect(() => {
    setIsCardListVisible(!isMobile);
  }, [isMobile]);

  const handleEditStateChange = (
    isEditing: boolean,
    designId: number | null,
  ) => {
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

      await createThumbnailForDesign(updatedDesign);

      toast({
        title: t("Changes Saved"),
        description: t("{{name}} has been updated successfully.", { name: designName }),
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setEditedPixels([]);
      setEditDesignId(null);
      handleEditStateChange(false, null);
    } catch (error) {
      toast({
        title: t("Error"),
        description: `${t("Failed to save changes")}: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSetCanvas = (designId: number, canvasId: number | null) => {
    const updatedDesigns = designs?.map((design) => {
      if (design.id === designId) {
        return { ...design, canvas: canvasId } as Design;
      }
      return design;
    });

    selectCanvas(canvasId, updatedDesigns || []);
  };

  const selectCanvas = (canvasId: number | null, designs: Design[]) => {
    if (!canvasId) return;
    setSelectedCanvasId(canvasId);

    setVisibleLayers(
      designs
        ?.filter((design) =>
          canvasId === null
            ? design.canvas === null
            : design.canvas === canvasId,
        )
        .map((design) => design.id) || [],
    );
  };


  useEffect(() => {
    if (canvasDesignsMap && selectedCanvas) {
      showAll();
    }
  }, [canvasDesignsMap, selectedCanvas, selectedCanvasId]);

  const showAll = () => {
    if (!selectedCanvas) return;
    setVisibleLayers((canvasDesignsMap.get(selectedCanvas.id) ?? []).map((design) => design.id));
  };

  const hideAll = () => {
    setVisibleLayers([]);
  };

  const handleOnDeleted = (designId: number) => {
    // Remove the design from the state
    setDesigns((prevDesigns) => {
      const updatedDesigns = prevDesigns.filter(
        (design) => design.id !== designId,
      );
      return updatedDesigns;
    });

    setEditDesignId(null);
    setVisibleLayers((prevLayers) =>
      prevLayers.filter((id) => id !== designId),
    );
  };

  const handleCreatedDesign = (design: Design) => {
    if (!currentUser || !["A", "B"].includes(currentUser.rank)) {
      throw new Error(t("User is not allowed to create a design"));
    }
    handleEditStateChange(true, design.id);
  };

  const handleSelectDesign = (designId: number) => {
    const design = designs?.find((d) => d.id === designId);
    if (!design) return;
  
    const dimensions = getDimensions(design.pixels);
  
    advancedViewportRef.current?.centerOnDesign(
      design.x,
      design.y,
      dimensions.width,
      dimensions.height,
    );
  
    const designsPanel = document.getElementById("designs-panel");
    if (designsPanel) {
      const designCard = designsPanel.querySelector(`#design-card-${designId}`);
      if (designCard) {
        const designCardTop = designCard.getBoundingClientRect().top;
        const panelTop = designsPanel.getBoundingClientRect().top;
        const scrollOffset = designCardTop - panelTop + designsPanel.scrollTop;
  
        designsPanel.scrollTo({
          top: scrollOffset,
          behavior: "smooth",
        });
      }
    }
  };

  const handleToggleDragMode = (designId: number, isDragMode: boolean) => {
    setDragModeDesignId(isDragMode ? designId : null);
  };

  const handleDesignPositionUpdate = async (designId: number, deltaX: number, deltaY: number) => {
    try {
      const design = designs?.find((d) => d.id === designId);
      if (!design) return;

      const newX = design.x + deltaX;
      const newY = design.y + deltaY;

      await updateDesignPosition(designId, newX, newY);
      
      toast({
        title: t("Success"),
        description: t("Design position updated successfully."),
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update design position."),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const onMoveDesignUp = async (designId: number) => await onChangeDesignOrder(designId, true);
  const onMoveDesignDown = async (designId: number) => await onChangeDesignOrder(designId, false);
  const onMoveDesignToIndex = async (designId: number, targetIndex: number) => {
    if (!selectedCanvas) return;
    
    // Create a copy of the canvas to modify
    const canvasCopy = { ...selectedCanvas };
    const layerOrder = [...canvasCopy.layer_order];
    
    const currentIndex = layerOrder.indexOf(designId);
    if (currentIndex === -1) {
      // If design not in layer order, insert it at the target index
      layerOrder.splice(targetIndex, 0, designId);
    } else {
      // Remove design from current position
      layerOrder.splice(currentIndex, 1);
      // Insert at target position
      layerOrder.splice(targetIndex, 0, designId);
    }
    
    canvasCopy.layer_order = layerOrder;
    await databaseUpdateCanvasLayerOrder(canvasCopy);
  };

  const onChangeDesignOrder = async (designId: number, up: boolean) => {
    if (!selectedCanvas) return;
    
    // Create a copy of the canvas to modify
    const canvasCopy = { ...selectedCanvas };
    const layerOrder = [...canvasCopy.layer_order];
    
    const designIndex = layerOrder.indexOf(designId);
    const targetIndex = up ? designIndex - 1 : designIndex + 1;

    if (designIndex !== -1 && targetIndex >= 0 && targetIndex < layerOrder.length) {
      const temp = layerOrder[designIndex];
      layerOrder[designIndex] = layerOrder[targetIndex];
      layerOrder[targetIndex] = temp;
    }

    if (designIndex === -1) {
      if (up) {
        layerOrder.unshift(designId)
      } else {
        layerOrder.push(designId)
      }
    }

    canvasCopy.layer_order = layerOrder;
    await databaseUpdateCanvasLayerOrder(canvasCopy);
  }

  if (loading) {
    return <Spinner size="xl" />;
  }

  const allColors = colors || [];

  return (
    <Box
      display="flex"
      flexDirection={isMobile ? "column" : "row"}
      height="calc(100vh - 150px)"
      overflow="hidden"
      position="relative"
    >
      {/* Viewport Section */}
      <Box
        flex={1}
        border="1px solid #ccc"
        overflow="hidden"
        height={isMobile && !isCardListVisible ? "100%" : "auto"}
      >
        <AdvancedViewport
          ref={advancedViewportRef}
          isEditing={isEditing}
          editDesignId={editDesignId}
          visibleLayers={new Set(visibleLayers)}
          colors={allColors}
          canvases={canvases || []}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={(canvas) =>
            handleSetCanvas(editDesignId || 0, canvas?.id || null)
          }
          editedPixels={editedPixels}
          setEditedPixels={setEditedPixels}
          onDesignSelect={handleSelectDesign}
          onSubmitEdit={handleSubmitEdit}
          onCancelEdit={() => handleEditStateChange(false, null)}
          dragModeDesignId={dragModeDesignId}
          onDesignPositionUpdate={handleDesignPositionUpdate}
        />
      </Box>

      {/* Design Cards List */}
      <Box
        display={isCardListVisible ? "flex" : "none"}
        flexDirection="column"
        border="1px solid #ccc"
        borderLeft={!isMobile ? "none" : "1px solid #ccc"}
        width={isMobile ? "100%" : "27rem"}
        height={isMobile ? "50%" : "auto"}
        ref={designCardsListRef}
      >
        <DesignsPanel
          designs={designs.filter(
            (design) => selectedCanvas?.id === design.canvas || !design.canvas,
          )}
          visibleLayers={visibleLayers}
          layerOrder={selectedCanvas?.layer_order || []}
          editDesignId={editDesignId}
          setEditDesignId={setEditDesignId}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSetCanvas={handleSetCanvas}
          onDeleted={handleOnDeleted}
          showAll={showAll}
          hideAll={hideAll}
          onSelectDesign={handleSelectDesign}
          onMoveDesignUp={onMoveDesignUp}
          onMoveDesignDown={onMoveDesignDown}
          onMoveDesignToIndex={onMoveDesignToIndex}
          dragModeDesignId={dragModeDesignId}
          onToggleDragMode={handleToggleDragMode}
        />
      </Box>

      {/* Hide/Show Button */}
      <IconButton
        aria-label={isCardListVisible ? t("Hide Panel") : t("Show Panel")}
        icon={
          isMobile ? (
            isCardListVisible ? (
              <FaAngleDown />
            ) : (
              <FaAngleUp />
            )
          ) : isCardListVisible ? (
            <FaAngleRight />
          ) : (
            <FaAngleLeft />
          )
        }
        onClick={() => setIsCardListVisible(!isCardListVisible)}
        size="md"
        variant="solid"
        colorScheme="blue"
        borderRadius="full"
        position="absolute"
        bottom={
          isMobile ? (isCardListVisible ? "calc(50% + 1rem)" : "1rem") : "50%"
        }
        right={isMobile ? "50%" : isCardListVisible ? "28rem" : "1rem"}
        transform={isMobile ? "translateX(50%)" : "translateY(50%)"}
        zIndex="1000"
      />

      {/* Create Design Button */}
      {isCardListVisible && (!!currentUser && ["A", "B"].includes(currentUser.rank)) && (
        <Box
          position="absolute"
          bottom={isMobile ? "1rem" : "2rem"}
          right={isMobile ? "1rem" : "2rem"}
          zIndex="1000"
        >
          <CreateDesignButton
            onCreate={handleCreatedDesign}
            canvasId={selectedCanvas?.id || 0}
          />
        </Box>
      )}
    </Box>
  );
};

export default DesignOffice;
