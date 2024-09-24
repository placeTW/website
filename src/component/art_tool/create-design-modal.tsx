import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { FC, useState } from "react";
import { databaseCreateDesign } from "../../api/supabase/database";
import { useUserContext } from "../../context/user-context";
import { Design } from "../../types/art-tool";

interface CreateDesignModalProps {
  isOpen: boolean;
  canvasId: number | undefined; 
  onClose: () => void;
  onCreate: (design: Design) => void;
}

const CreateDesignModal: FC<CreateDesignModalProps> = ({ isOpen, canvasId, onClose, onCreate }) => {
  const [designName, setDesignName] = useState("");
  const { currentUser } = useUserContext();

  const handleCreateDesign = async () => {
    if (currentUser) {
      const response = await databaseCreateDesign(
        designName,
        canvasId,
        currentUser.user_id
      );
      if (response) {
        onClose();
        onCreate(response);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Design</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Design Name"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleCreateDesign}>
            Create
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateDesignModal;
