// src/component/auth-provider-modal.tsx

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Provider } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  authGetSession,
  authSignInWithOAuth,
  authSignOut,
  supabase,
} from "../api/supabase";
import { useUserContext } from "../context/user-context";


interface AuthProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  authType: "register" | "login";
}

const AuthProviderModal: React.FC<AuthProviderModalProps> = ({
  isOpen,
  onClose,
  authType,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const { setCurrentUser, currentUser } = useUserContext(); // Access setCurrentUser and currentUser

  const handleAuth = async (provider: Provider) => {
    const { data, error } = await authSignInWithOAuth(
      provider,
      window.location.href,
    );

    if (error) {
      console.error(t("Error signing in:"), error);
      setError(t("Error signing in"));
      return;
    }

    // Redirect the user to the OAuth URL
    window.location.href = data.url;
  };

  useEffect(() => {
    // Check if user is already authenticated when modal opens
    const checkAuthState = async () => {
      const {
        data: { session },
        error,
      } = await authGetSession();

      if (error) {
        console.error(t("Error fetching session:"), error);
        setError(t("Error fetching session"));
        return;
      }

      if (session && currentUser) {
        // User is already authenticated and UserContext has user data
        if (currentUser.rank === "F") {
          await authSignOut();
          setError(t("Your account has been banned."));
        } else {
          onClose(); // Close modal if user is already authenticated
        }
      }
    };

    if (isOpen) {
      checkAuthState();
    }

    // Subscribe to the 'bans' channel
    const subscription = supabase
      .channel("bans")
      .on("broadcast", { event: "ban" }, async (payload) => {
        const {
          data: { session },
        } = await authGetSession();
        const userId = session?.user?.id;
        if (payload?.payload?.userId === userId) {
          await authSignOut();
          setError(t("Your account has been banned."));
        }
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isOpen, onClose, t, setCurrentUser, currentUser]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {authType === "register"
            ? t("Choose Registration Provider")
            : t("Choose Login Provider")}
        </ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            {error && <Text color="red.500">{error}</Text>}
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
