import {
  Box,
  Flex,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from "@chakra-ui/react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { FaEllipsisVertical, FaEye, FaEyeSlash, FaMagnifyingGlass as FaSearch } from "react-icons/fa6";
import { Design } from "../../types/art-tool";
import DesignCardsList from "./design-cards-list";

interface DesignsPanelProps {
  designs: Design[];
  visibleLayers: number[];
  layerOrder: number[];
  editDesignId: number | null;
  setEditDesignId: Dispatch<SetStateAction<number | null>>;
  onEditStateChange: (isEditing: boolean, designId: number | null) => void;
  onVisibilityChange: (newVisibleLayers: number[]) => void;
  onSetCanvas: (designId: number, canvasId: number | null) => void;
  onDeleted: (designId: number) => void;
  onSelectDesign: (designId: number) => void;
  onMoveDesignUp: (designId: number) => void;
  onMoveDesignDown: (designId: number) => void;
  onMoveDesignToIndex: (designId: number, targetIndex: number) => void;
  showAll: () => void;
  hideAll: () => void;
}

const DesignsPanel: React.FC<DesignsPanelProps> = ({
  designs,
  visibleLayers,
  layerOrder,
  editDesignId,
  setEditDesignId,
  onEditStateChange,
  onVisibilityChange,
  onSetCanvas,
  onDeleted,
  onSelectDesign,
  onMoveDesignUp,
  onMoveDesignDown,
  onMoveDesignToIndex,
  showAll,
  hideAll,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Box
        position="sticky"
        top="0"
        zIndex="1"
        bg="white"
        borderBottom="1px solid #ccc"
      >
        <Flex
          padding={4}
          paddingTop={{
            base: 4,
            md: 2,
          }}
          alignItems="center"
        >
          <Heading size="md">Designs</Heading>
          <Spacer />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<FaEllipsisVertical />}
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
        <Flex padding={4} paddingTop={2}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Flex>
      </Box>

      <Box overflowY="auto" flex="1" id="designs-panel" height="100%">
        <DesignCardsList
          designs={designs}
          visibleLayers={visibleLayers}
          layerOrder={layerOrder}
          editDesignId={editDesignId}
          setEditDesignId={setEditDesignId}
          onEditStateChange={onEditStateChange}
          onVisibilityChange={onVisibilityChange}
          onSetCanvas={onSetCanvas}
          onDeleted={onDeleted}
          searchQuery={searchQuery}
          onSelectDesign={onSelectDesign}
          onMoveDesignUp={onMoveDesignUp}
          onMoveDesignDown={onMoveDesignDown}
          onMoveDesignToIndex={onMoveDesignToIndex}
        />
        <Box h="100px" />
      </Box>
    </>
  );
};

export default DesignsPanel;
