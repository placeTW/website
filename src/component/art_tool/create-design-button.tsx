import { Box, Button } from "@chakra-ui/react";
import { FC, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import CreateDesignModal from "./create-design-modal";
import { Design } from "../../types/art-tool";

interface CreateDesignButtonProps {
  canvasId: number | undefined;
  onCreate: (design: Design) => void;
}

const CreateDesignButton: FC<CreateDesignButtonProps> = ({ canvasId, onCreate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Box>
        <Button
          leftIcon={<FaPlus />}
          aria-label="Create new design"
          size="lg"
          colorScheme="blue"
          onClick={handleOpenModal}
          boxShadow="lg"
          borderRadius="full"
        >
          New Design
        </Button>
      </Box>
      <CreateDesignModal isOpen={isModalOpen} canvasId={canvasId} onClose={handleCloseModal} onCreate={onCreate} />
    </>
  );
};

export default CreateDesignButton;
