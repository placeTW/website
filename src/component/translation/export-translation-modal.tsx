import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Textarea,
  ModalFooter,
  Button,
  Icon,
  ModalHeader,
  Text,
  CardBody,
  Card,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaGithub } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  url: string;
  needCopy?: boolean;
}

const ExportTranslationModal = ({
  isOpen,
  onClose,
  data,
  url,
  needCopy,
}: ModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("Submit translation")}</ModalHeader>
        <ModalBody p={0}>
          <Card>
            <CardBody>
              <Text>You are about to submit the following translation:</Text>
              <Textarea value={data} readOnly={true} rows={25} />
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          {needCopy && (
            <Button
              leftIcon={<Icon as={FaGithub} />}
              colorScheme="gray"
              variant="outline"
              size="md"
              onClick={() => {
                navigator.clipboard.writeText(data);
              }}
              mr={3}
            >
              Copy to Clipboard
            </Button>
          )}
          <Button
            leftIcon={<Icon as={FaGithub} />}
            colorScheme="gray"
            variant="outline"
            size="md"
            onClick={() => {
              window.open(url, "_blank", "noopener");
            }}
          >
            Submit to GitHub
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportTranslationModal;
