import { Box, Button } from "@chakra-ui/react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import CreateDesignModal from "./create-design-modal";

const CreateDesignButton = () => {
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
      <CreateDesignModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default CreateDesignButton;
