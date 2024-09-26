import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { Design } from "../../types/art-tool";

export interface ContextMenuDesign extends Design {
  color: string;
}

interface ViewportContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  designs: ContextMenuDesign[];
  onDesignSelect: (designId: number) => void;
}

const ViewportContextMenu: React.FC<ViewportContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  designs,
  onDesignSelect,
}) => {
  return (
    <Menu isOpen={isOpen} onClose={onClose}>
      <MenuButton
        position="fixed"
        top={position.y}
        left={position.x}
        opacity={0}
        width="1px"
        height="1px"
      />
      <MenuList>
        {designs.map((design) => (
          <MenuItem key={design.id} onClick={() => onDesignSelect(design.id)}>
            <Flex alignItems="center">
              <Box
                width="20px"
                height="20px"
                backgroundColor={design.color}
                marginRight="10px"
                border="1px solid #ccc"
              />
              <Text>
                {design.design_name} by {design.user_handle} (#{design.id})
              </Text>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default ViewportContextMenu;
