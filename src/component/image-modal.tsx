import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { FC } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

const ImageModal: FC<ModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Image
            src={imageUrl}
            alt={altText}
            objectFit="contain"
            w="100%"
            h="100%"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
