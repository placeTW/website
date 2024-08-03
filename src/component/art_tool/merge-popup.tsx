import React from 'react';
import { Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";

interface MergePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (destination: string) => void;
}

const MergePopup: React.FC<MergePopupProps> = ({ isOpen, onClose, onMerge }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Merge Layer</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <p>Select where you'd like to merge this layer:</p>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={() => onMerge('main')}>
            Main
          </Button>
          <Button colorScheme="green" mr={3} onClick={() => onMerge('expansion')}>
            Expansion
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MergePopup;
