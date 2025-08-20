import {
  Box,
  IconButton,
  Spinner,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"; // Import icons
import {
  saveEditedPixels,
  createThumbnailForDesign,
  databaseUpdateCanvasLayerOrder
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignsPanel from "../component/art_tool/designs-panel";
import { CLEAR_ON_DESIGN } from "../component/viewport/constants";
import { ViewportHandle } from "../component/viewport/types";
import { useColorContext } from "../context/color-context";
import { useDesignContext } from "../context/design-context";
import { Canvas, Design, Pixel } from "../types/art-tool";
import { getDimensions, offsetPixels } from "../utils/pixelUtils";
import { useUserContext } from "../context/user-context";

const DesignOffice: React.FC = () => {
  const { designs, canvases, canvasesMap, canvasDesignsMap, setDesigns } = useDesignContext();
  const { colors } = useColorContext();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas>(canvases[0]);
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

  // Select the first canvas by default
  useEffect(() => {
    if (canvases && canvases.length > 0) {
      selectCanvas(canvases[0].id, designs || []);
    }
  }, [canvases]);

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
        title: "Changes Saved",
        description: `${designName} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setEditedPixels([]);
      setEditDesignId(null);
      handleEditStateChange(false, null);
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
    const canvas = canvasesMap.get(canvasId);
    if (!canvas) {
      return;
    }
    setSelectedCanvas(canvas);

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
  }, [canvasDesignsMap, selectedCanvas]);

  const showAll = () => {
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
      throw new Error("User is not allowed to create a design");
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

  const onMoveDesignUp = async (designId: number) => await onChangeDesignOrder(designId, true);
  const onMoveDesignDown = async (designId: number) => await onChangeDesignOrder(designId, false);

  const onChangeDesignOrder = async (designId: number, up: boolean) => {
    const layerOrder = selectedCanvas.layer_order;
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

    setSelectedCanvas({...selectedCanvas, layer_order: layerOrder})
    await databaseUpdateCanvasLayerOrder(selectedCanvas);
  }

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
  ];

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
            (design) => selectedCanvas.id === design.canvas || !design.canvas,
          )}
          visibleLayers={visibleLayers}
          layerOrder={selectedCanvas.layer_order}
          editDesignId={editDesignId}
          setEditDesignId={setEditDesignId}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit}
          onSetCanvas={handleSetCanvas}
          onDeleted={handleOnDeleted}
          editedPixels={editedPixels}
          showAll={showAll}
          hideAll={hideAll}
          onSelectDesign={handleSelectDesign}
          onMoveDesignUp={onMoveDesignUp}
          onMoveDesignDown={onMoveDesignDown}
        />
      </Box>

      {/* Hide/Show Button */}
      <IconButton
        aria-label={isCardListVisible ? "Hide Panel" : "Show Panel"}
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
            canvasId={selectedCanvas.id}
          />
        </Box>
      )}
    </Box>
  );
};

export default DesignOffice;
