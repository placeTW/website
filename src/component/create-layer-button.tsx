import { Box, IconButton } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useState } from "react";
import CreateCardModal from "./create-card-modal";

interface CreateLayerButtonProps {
  onClick: () => void;
}

const CreateLayerButton: React.FC<CreateLayerButtonProps> = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      position="fixed"
      bottom="24px"
      right="24px"
      zIndex="1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconButton
        aria-label="Create new layer"
        icon={<AddIcon />}
        size="lg"
        colorScheme="blue"
        borderRadius="50%"
        boxShadow="lg"
        onClick={onClick}
        transform={isHovered ? "scale(1.1)" : "scale(1.0)"}
        transition="transform 0.2s"
      />
    </Box>
  );
};

export default CreateLayerButton;
