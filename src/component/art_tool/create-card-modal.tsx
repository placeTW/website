import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    Input,
  } from "@chakra-ui/react";
  import { FC, useState } from "react";
  import { createLayer } from "../../api/supabase/database";
  import { useUserContext } from "../../context/user-context";
  
  interface CreateCardModalProps {
    isOpen: boolean;
    onClose: () => void;
  }
  
  const CreateCardModal: FC<CreateCardModalProps> = ({ isOpen, onClose }) => {
    const [layerName, setLayerName] = useState("");
    const { currentUser } = useUserContext();
  
    const handleCreateLayer = async () => {
      if (currentUser) {
        try {
          await createLayer(layerName, currentUser.user_id);
          onClose();
        } catch (error) {
          console.error("Error creating layer:", error);
        }
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Layer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Layer Name"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCreateLayer}>
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
  
  export default CreateCardModal;
  