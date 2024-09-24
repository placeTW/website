import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { authGetSession, authSignOut } from "../api/supabase/auth";
import { functionsFetchOneUser, functionsUpdateNickname } from "../api/supabase/functions";
import { useUserContext } from "../context/user-context";
import AuthProviderModal from "./auth-provider-modal";
import { FaBars, FaPen, FaArrowRightToBracket, FaArrowRightFromBracket } from "react-icons/fa6"; // Import icons

const enableArtTool = import.meta.env.VITE_ENABLE_ART_TOOL;

const Navbar = () => {
  const { currentUser, ranks, logoutUser, setCurrentUser } = useUserContext();
  const { t } = useTranslation();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [username, setUsername] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [userInserted] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await authGetSession();
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
            setCurrentUser(userData);
            setAuthModalOpen(false);
          }
        } catch (fetchError) {
          console.error("User not found in art_tool_users, but handled by UserProvider", fetchError);
          setAuthModalOpen(false);
        }
      } else {
        setAuthModalOpen(true);
      }
    };
    checkSession();
  }, [setCurrentUser, userInserted, t]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.handle || "");
    }
  }, [currentUser]);

  const handleOpenModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => setAuthModalOpen(false);

  const handleLogout = async () => {
    await authSignOut();
    logoutUser();
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

  const userRankName = ranks.find((rank) => rank.rank_id === currentUser?.rank)?.rank_name || "";

  return (
    <Box bg="blue.500" px={4} py={2} w="100vw" overflow="hidden">
      <Flex alignItems="center" maxW="100%" justify="space-between" flexShrink={0}>
        <Heading as="h1" size="lg" color="white" whiteSpace="nowrap">
          PlaceTW
        </Heading>

        <Spacer minWidth="40px" />

        {/* Desktop Navigation */}
        <Box display={{ base: "none", md: "flex" }} alignItems="center" justifyContent="flex-end" flexShrink={0}>
          {enableArtTool && (
            <>
              <Box textAlign="center" mr={6}>
                <RouterLink to="/briefing-room" style={{ color: "white" }}>
                  {t("Briefing Room")}
                </RouterLink>
              </Box>
              <Box textAlign="center" mr={6}>
                <RouterLink to="/design-office" style={{ color: "white" }}>
                  {t("Design Office")}
                </RouterLink>
              </Box>
            </>
          )}
          <Box textAlign="center" mr={6}>
            <RouterLink to="/gallery" style={{ color: "white" }}>
              {t("Gallery")}
            </RouterLink>
          </Box>
          {currentUser && (currentUser.rank === "A" || currentUser.rank === "B") && (
            <Box textAlign="center" mr={6}>
              <RouterLink to="/admin" style={{ color: "white" }}>
                {t("Officers")}
              </RouterLink>
            </Box>
          )}
        </Box>

        {/* Icons for both Mobile and Desktop with even spacing */}
        <HStack spacing={4} display="flex" alignItems="center" justifyContent="flex-end">
          {currentUser ? (
            <>
              <Text
                color="white"
                textAlign="center"
                mr={2}
                whiteSpace="nowrap"
                display="block"
              >
                {t("Welcome")}, {userRankName} {currentUser?.handle || ""}
              </Text>
              <IconButton
                aria-label="Edit Username"
                icon={<FaPen />}
                onClick={onOpen}
                colorScheme="blue"
              />
              <IconButton
                aria-label="Logout"
                icon={<FaArrowRightFromBracket />}
                onClick={handleLogout}
                colorScheme="blue"
              />
            </>
          ) : (
            <IconButton
              aria-label="Login"
              icon={<FaArrowRightToBracket />}
              onClick={handleOpenModal}
              colorScheme="blue"
            />
          )}

          {/* Mobile dropdown menu for small screens */}
          <Box display={{ base: "flex", md: "none" }}>
            <Menu>
              <MenuButton as={IconButton} icon={<FaBars />} variant="outline" color="white" />
              <MenuList>
                {enableArtTool && (
                  <>
                    <MenuItem as={RouterLink} to="/briefing-room">
                      {t("Briefing Room")}
                    </MenuItem>
                    <MenuItem as={RouterLink} to="/design-office">
                      {t("Design Office")}
                    </MenuItem>
                  </>
                )}
                <MenuItem as={RouterLink} to="/gallery">
                  {t("Gallery")}
                </MenuItem>
                {currentUser && (currentUser.rank === "A" || currentUser.rank === "B") && (
                  <MenuItem as={RouterLink} to="/admin">
                    {t("Officers")}
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </Box>
        </HStack>
      </Flex>

      <AuthProviderModal isOpen={isAuthModalOpen} onClose={handleCloseModal} authType="login" />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("Edit Username")}</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
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
