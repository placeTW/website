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
  Box,
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
              <Text>
                {t("You are about to submit the following translation:")}
              </Text>
              <Textarea value={data} readOnly={true} rows={20} />
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          {needCopy && (
            <Text mr={2} color="red.500" fontSize="xs">
              {t(
                "The translation is too long to submit directly to GitHub. Paste the translation once you are redirected to GitHub."
              )}
            </Text>
          )}
          <Box>
            <Button
              leftIcon={<Icon as={FaGithub} />}
              colorScheme="gray"
              variant="outline"
              size="md"
              onClick={async () => {
                if (needCopy) {
                  await navigator.clipboard.writeText(data).then(() => {
                    alert(t("Translation copied to clipboard."));
                  });
                }
                window.open(url, "_blank", "noopener");
              }}
            >
              {t("Submit to Github")}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportTranslationModal;
