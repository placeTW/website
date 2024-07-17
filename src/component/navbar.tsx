import { Box, Button, Flex, Heading, Link, Spacer } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import AuthProviderModal from "./auth-provider-modal";
import LanguageSwitcher from "./language-switcher";

const Navbar = () => {
  const { t } = useTranslation();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");

  const handleOpenModal = (type: "login" | "register") => {
    setAuthType(type);
    setAuthModalOpen(true);
  };
  const handleCloseModal = () => setAuthModalOpen(false);

  return (
    <Box bg="blue.500" px={4} py={2}>
      <Flex alignItems="center" maxW="xxl">
        <Heading as="h1" size="lg" color="white">
          PlaceTW
        </Heading>

        <Spacer />

        <Box>
          <Link as={RouterLink} to="/" color="white" mr={4}>
            {t("Home")}
          </Link>
          <Link as={RouterLink} to="/gallery" color="white" mr={4}>
            {t("Gallery")}
          </Link>
        </Box>

        <Box>
          <LanguageSwitcher />
        </Box>

        <Box ml={4}>
          <Button
            onClick={() => handleOpenModal("register")}
            colorScheme="blue"
            mr={2}
          >
            {t("Register")}
          </Button>
          <Button onClick={() => handleOpenModal("login")} colorScheme="blue">
            {t("Login")}
          </Button>
        </Box>
      </Flex>

      <AuthProviderModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseModal}
        authType={authType}
      />
    </Box>
  );
};

export default Navbar;
