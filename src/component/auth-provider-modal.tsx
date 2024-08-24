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
import {
  authGetSession,
  authSignInWithOAuth,
  authSignOut,
  functionsFetchOneUser,
  insertNewUser,
  supabase,
  removeSupabaseChannel,
} from "../api/supabase";

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
    const { data, error } = await authSignInWithOAuth(
      provider,
      window.location.href
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

          if (userData.rank === "F") {
            await authSignOut();
            setError(t("Your account has been banned."));
          } else {
            onClose();
          }
        } catch (fetchError) {
          console.error(
            t("User not found in art_tool_users, attempting to insert user:"),
            fetchError
          );

          try {
            await insertNewUser(
              session.user?.id || "",
              session.user?.email || "",
              session.user?.user_metadata?.name ||
                session.user?.user_metadata?.full_name ||
                ""
            );
            onClose();
          } catch (insertError) {
            console.error(
              t("Error inserting new user into art_tool_users:"),
              insertError
            );
            setError(t("Error inserting new user into art_tool_users"));
          }
        }
      } else {
        // No session is present, handle accordingly if needed
      }
    };

    if (isOpen) {
      checkSession();
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
      removeSupabaseChannel(subscription);
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
