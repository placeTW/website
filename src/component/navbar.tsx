import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  authGetSession,
  authSignOut,
  functionsFetchOneUser,
  functionsUpdateNickname,
  insertNewUser,
} from "../api/supabase";
import { useUserContext } from "../context/user-context";
import AuthProviderModal from "./auth-provider-modal";
import LanguageSwitcher from "./language-switcher";

const enableArtTool = import.meta.env.VITE_ENABLE_ART_TOOL;

const Navbar = () => {
  const { currentUser, logoutUser } = useUserContext();
  const { t } = useTranslation(); // Initialize the useTranslation hook
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [userInserted, setUserInserted] = useState(false); // Add state variable

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await authGetSession();

      if (error) {
        console.error(t("Error fetching session:"), error);
        return;
      }

      if (session) {
        try {
          const userData = await functionsFetchOneUser();
          if (userData.rank === "F") {
            await authSignOut();
            alert(t("Your account has been banned."));
          } else {
            setAuthModalOpen(false);
          }
        } catch (fetchError) {
          console.error(
            t("User not found in art_tool_users, attempting to insert user:"),
            fetchError,
          );

          try {
            await insertNewUser(
              session.user?.id || "",
              session.user?.email || "",
              session.user?.user_metadata?.name ||
                session.user?.user_metadata?.full_name ||
                "",
            );
            setUserInserted(true); // Update state variable
            setAuthModalOpen(false);
          } catch (insertError) {
            console.error(
              t("Error inserting new user into art_tool_users:"),
              insertError,
            );
            // Removed the alert here
          }
        }
      } else {
        setAuthModalOpen(true);
      }
    };

    checkSession();
  }, [userInserted]); // Add dependency to trigger re-render

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.handle);
    }
  }, [currentUser]);

  const handleOpenModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => setAuthModalOpen(false);

  const handleLogout = async () => {
    await authSignOut();
    logoutUser(); // Update context to reflect the logged-out state
    navigate("/");
  };

  const handleSaveUsername = async () => {
    try {
      if (!currentUser) {
        return;
      }

      await functionsUpdateNickname(username);

      onClose();
    } catch (error) {
      console.error(t("Error updating username"), error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveUsername();
    }
  };

  return (
    <Box bg="blue.500" px={4} py={2}>
      <Flex alignItems="center" maxW="xxl" justify="space-between">
        <Heading as="h1" size="lg" color="white">
          PlaceTW
        </Heading>

        <Spacer minWidth="40px" />

        <Box display="flex" alignItems="center" justifyContent="flex-end">
          {enableArtTool && (
            <>
              <Box textAlign="center" mr={6}>
                <Link as={RouterLink} to="/briefing-room" color="white">
                  {t("Briefing Room")}
                </Link>
              </Box>
              <Box textAlign="center" mr={6}>
                <Link as={RouterLink} to="/design-office" color="white">
                  {t("Design Office")}
                </Link>
              </Box>
            </>
          )}
          <Box textAlign="center" mr={6}>
            <Link as={RouterLink} to="/gallery" color="white">
              {t("Gallery")}
            </Link>
          </Box>
          {currentUser &&
            (currentUser.rank === "A" || currentUser.rank === "B") && (
              <Box textAlign="center" mr={6}>
                <Link as={RouterLink} to="/admin" color="white">
                  {t("Officers")}
                </Link>
              </Box>
            )}
          <Box>
            <LanguageSwitcher />
          </Box>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          ml={6}
        >
          {currentUser ? (
            <>
              <Text color="white" textAlign="center" mr={2}>
                {t("Welcome")}, {currentUser.rank_name} {currentUser.handle}
              </Text>
              <Box display="flex" flexDirection="column" mr={2}>
                <Button onClick={onOpen} colorScheme="blue">
                  {t("Edit Username")}
                </Button>
              </Box>
              <Box display="flex" flexDirection="column">
                <Button onClick={handleLogout} colorScheme="blue">
                  {t("Logout")}
                </Button>
              </Box>
            </>
          ) : (
            <Button onClick={handleOpenModal} colorScheme="blue">
              {t("Login")}
            </Button>
          )}
        </Box>
      </Flex>

      <AuthProviderModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseModal}
        authType="login"
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("Edit Username")}</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown} // Handle Enter key press
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSaveUsername}>
              {t("Save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Navbar;
