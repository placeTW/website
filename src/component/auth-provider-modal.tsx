import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";

const AuthProviderModal = ({
  isOpen,
  onClose,
  authType,
}: {
  isOpen: boolean;
  onClose: () => void;
  authType: "login" | "register";
}) => {
  const { t } = useTranslation();

  const handleAuth = async (provider: "google" | "discord") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + "/set-nickname",
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {authType === "register"
            ? "Choose Registration Provider"
            : "Choose Login Provider"}
        </ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            <Button onClick={() => handleAuth("google")} colorScheme="blue">
              {authType === "register"
                ? t("Register with Google")
                : t("Login with Google")}
            </Button>
            <Button onClick={() => handleAuth("discord")} colorScheme="blue">
              {authType === "register"
                ? t("Register with Discord")
                : t("Login with Discord")}
            </Button>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{t("Close")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthProviderModal;
