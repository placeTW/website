import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
  } from "@chakra-ui/react";
  import { useState } from "react";
  
  interface CreateCardModalProps {
    isOpen: boolean;
    onClose: () => void;
  }
  
  const CreateCardModal: React.FC<CreateCardModalProps> = ({ isOpen, onClose }) => {
    const [cardName, setCardName] = useState("");
    const toast = useToast();
  
    const handleCreate = () => {
      if (cardName.trim() === "") {
        toast({
          title: "Error",
          description: "Card name cannot be empty.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      // Call the function to create a new card with cardName
      // Example: createNewCard(cardName);
  
      onClose();
      setCardName(""); // Reset card name
  
      toast({
        title: "Success",
        description: `Card "${cardName}" created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Layer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Card Name</FormLabel>
              <Input
                placeholder="Enter card name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreate}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CreateCardModal;
  