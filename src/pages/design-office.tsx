// src/pages/design-office.tsx

import {
  Box,
  IconButton,
  Spinner,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"; // Import icons
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
import { useColorContext } from "../context/color-context";
import { useDesignContext } from "../context/design-context";
import { Canvas, Design, Pixel } from "../types/art-tool";
import { createThumbnail } from "../utils/imageUtils";
import { offsetPixels } from "../utils/pixelUtils";

const DesignOffice: React.FC = () => {
  const { designs, canvases, setDesigns } = useDesignContext();
  const { colors } = useColorContext();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const [isCardListVisible, setIsCardListVisible] = useState(true); // New state for card list visibility
  const [isMobile] = useMediaQuery("(max-width: 768px)"); // Media query for mobile devices
  const toast = useToast();

  useEffect(() => {
    if (colors && designs) {
      setLoading(false);
    }
  }, [colors, designs]);

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

  const handleSetCanvas = (designId: number, canvasId: number | null) => {
    const updatedDesigns = designs?.map((design) => {
      if (design.id === designId) {
        return { ...design, canvas: canvasId };
      }
      return design;
    });

    setSelectedCanvas(
      canvases?.find((canvas) => canvas.id === canvasId) || null,
    );

    setVisibleLayers(
      updatedDesigns
        ?.filter((design) =>
          canvasId === null
            ? design.canvas === null
            : design.canvas === canvasId,
        )
        .map((design) => design.id) || [],
    );
  };

  const handleResetViewport = () => {
    setVisibleLayers([]);
    setSelectedCanvas(null);
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
    handleEditStateChange(true, design.id);
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
      gridTemplateColumns={{
        base: "1fr",
        md: isCardListVisible ? "1fr 350px" : "1fr",
      }}
      height="calc(100vh - 150px)"
      overflow="hidden"
      position="relative"
    >
      {/* Viewport Section */}
      <Box border="1px solid #ccc" overflow="hidden">
        <AdvancedViewport
          isEditing={isEditing}
          editDesignId={editDesignId}
          visibleLayers={visibleLayers}
          colors={allColors}
          canvases={canvases || []}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={(canvas) =>
            handleSetCanvas(editDesignId || 0, canvas?.id || null)
          }
          onResetViewport={handleResetViewport}
          editedPixels={editedPixels}
          setEditedPixels={setEditedPixels}
        />
      </Box>

      {/* Design Cards List */}
      {isCardListVisible && (
        <Box overflowY="auto">
          <DesignCardsList
            designs={designs || []}
            visibleLayers={visibleLayers}
            editDesignId={editDesignId}
            setEditDesignId={setEditDesignId}
            onEditStateChange={handleEditStateChange}
            onVisibilityChange={handleVisibilityChange}
            onSubmitEdit={handleSubmitEdit}
            onSetCanvas={handleSetCanvas}
            onDeleted={handleOnDeleted}
            editedPixels={editedPixels}
          />
          <Box h="100px" />
        </Box>
      )}

      {/* Hide/Show Button */}
      <Box
        position="absolute"
        top={{
          base: "auto",
          md: "50%",
        }}
        transform="translateY(-50%)"
        right={{
          base: "50%",
          md: isCardListVisible ? "362px" : "12px",
        }}
        left={{
          base: "50%",
          md: "auto",
        }}
        bottom={{
          base: isCardListVisible ? "calc(50% + 28px)" : "28px",
          md: "auto",
        }}
        zIndex="1000"
      >
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
        />
      </Box>

      {/* Create Design Button */}
      {isCardListVisible && (
        <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
          <CreateDesignButton onCreate={handleCreatedDesign} />
        </Box>
      )}
    </Box>
  );
};

export default DesignOffice;
