import { Box, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import CreateCardModal from "./create-card-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const CreateLayerButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Box position="fixed" bottom="20px" right="20px">
        <IconButton
          aria-label="Create New Layer"
          icon={<FontAwesomeIcon icon={faPlus} />}
          isRound
          size="lg"
          colorScheme="teal"
          onClick={handleOpenModal}
        />
      </Box>
      <CreateCardModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default CreateLayerButton;
