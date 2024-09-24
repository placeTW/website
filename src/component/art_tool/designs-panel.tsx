import {
  Box,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";
import { FaEllipsisV, FaEye, FaEyeSlash } from "react-icons/fa";
import { Design, Pixel } from "../../types/art-tool";
import DesignCardsList from "./design-cards-list";

interface DesignsPanelProps {
  designs: Design[];
  visibleLayers: number[];
  editDesignId: number | null;
  setEditDesignId: Dispatch<SetStateAction<number | null>>;
  onEditStateChange: (isEditing: boolean, designId: number | null) => void;
  onVisibilityChange: (newVisibleLayers: number[]) => void;
  onSubmitEdit: (designName: string) => void;
  onSetCanvas: (designId: number, canvasId: number | null) => void;
  onDeleted: (designId: number) => void;
  editedPixels: Pixel[];
  showAll: () => void;
  hideAll: () => void;
}

const DesignsPanel: React.FC<DesignsPanelProps> = ({
  designs,
  visibleLayers,
  editDesignId,
  setEditDesignId,
  onEditStateChange,
  onVisibilityChange,
  onSubmitEdit,
  onSetCanvas,
  onDeleted,
  editedPixels,
  showAll,
  hideAll,
}) => {
  return (
    <>
      <Box position="sticky" top="0" zIndex="1" bg="white">
        <Flex padding={4} paddingTop={2} alignItems="center">
          <Heading size="md">Designs</Heading>
          <Spacer />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<FaEllipsisV />}
              variant="outline"
            />
            <MenuList>
              <MenuItem icon={<FaEye />} onClick={showAll}>
                Show All
              </MenuItem>
              <MenuItem icon={<FaEyeSlash />} onClick={hideAll}>
                Hide All
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      <Box overflowY="auto" flex="1">
        <DesignCardsList
          designs={designs}
          visibleLayers={visibleLayers}
          editDesignId={editDesignId}
          setEditDesignId={setEditDesignId}
          onEditStateChange={onEditStateChange}
          onVisibilityChange={onVisibilityChange}
          onSubmitEdit={onSubmitEdit}
          onSetCanvas={onSetCanvas}
          onDeleted={onDeleted}
          editedPixels={editedPixels}
        />
        <Box h="100px" />
      </Box>
    </>
  );
};

export default DesignsPanel;
