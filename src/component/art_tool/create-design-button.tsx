import { AddIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
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
      <Box position="fixed" bottom="100px" right="30px" zIndex={1000}>
        <IconButton
          icon={<AddIcon />}
          aria-label="Create new layer"
          size="lg"
          colorScheme="blue"
          onClick={handleOpenModal}
          boxShadow="lg"
          borderRadius="full"
        />
      </Box>
      <CreateCardModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default CreateDesignButton;
