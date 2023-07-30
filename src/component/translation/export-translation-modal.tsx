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
import { FaCopy } from "react-icons/fa";

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
}: ModalProps) => {
  const { t } = useTranslation();

  const DISCORD_URL = "https://discord.com/channels/959467908315111444/1134276308277395537"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("Submit Translation")}</ModalHeader>
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
          <Text mr={2} fontSize="xs">
            {t(
              "Copy the translation to clipboard and go to the Discord channel to submit the translation."
            )}
          </Text>
          <Box>
            <Button
              leftIcon={<Icon as={FaCopy} />}
              colorScheme="gray"
              variant="outline"
              size="md"
              onClick={async () => {
                await navigator.clipboard.writeText(data).then(() => {
                  alert(t("Translation copied to clipboard."));
                });
                window.open(DISCORD_URL, "_blank", "noopener");
              }}
            >
              {t("Copy to clipboard")}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportTranslationModal;
