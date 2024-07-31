import { AddIcon } from "@chakra-ui/icons";
import { Box, Button } from "@chakra-ui/react";
import { useState } from "react";
import CreateCardModal from "./create-card-modal";

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
          leftIcon={<AddIcon />}
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
      <CreateCardModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default CreateDesignButton;
