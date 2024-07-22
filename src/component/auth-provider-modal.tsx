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
import { Provider } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { functionsFetchOneUser, authSignInWithOAuth, authGetSession, authSignOut, supabase } from "../api/supabase";

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

  const handleAuth = async (provider: Provider) => {
    console.log(t("Starting authentication with provider:"), provider);

    const { data, error } = await authSignInWithOAuth(
      provider,
      window.location.href,
    );

    if (error) {
      console.error(t("Error signing in:"), error);
      setError(t("Error signing in"));
      return;
    }

    console.log(t("Authentication data:"), data);

    // Redirect the user to the OAuth URL
    window.location.href = data.url;
  };

  useEffect(() => {
    if (!isOpen) return;

    // Check session after redirect
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await authGetSession();

      if (error) {
        console.error(t("Error fetching session:"), error);
        setError(t("Error fetching session"));
        return;
      }

      if (session) {
        try {
          const userData = await functionsFetchOneUser();
          console.log("Fetched user data:", userData);

          if (userData.rank === "F") {
            console.log("User is banned, signing out...");
            await authSignOut();
            setError(t("Your account has been banned."));
          } else {
            console.log("User is not banned, closing modal...");
            onClose();
          }
        } catch (fetchError) {
          console.error(
            t("Error fetching user from art_tool_users:"),
            fetchError,
          );
          setError(t("Error fetching user from art_tool_users"));
        }
      }
    };

    checkSession();

    // Subscribe to the 'bans' channel
    const subscription = supabase
      .channel("bans")
      .on("broadcast", { event: "ban" }, async (payload) => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (payload?.payload?.userId === userId) {
          console.log("User has been banned, signing out...");
          await supabase.auth.signOut();
          setError(t("Your account has been banned."));
        }
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isOpen, onClose, t]);

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
            {error && <p style={{ color: "red" }}>{error}</p>}
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
