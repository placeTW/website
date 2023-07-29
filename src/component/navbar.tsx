import { Box, Flex, Spacer, Heading, Link } from "@chakra-ui/react";
import LanguageSwitcher from "./language-switcher";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  return (
    <Box bg="blue.500" px={4} py={2}>
      <Flex alignItems="center" maxW="xxl">
        <Heading as="h1" size="lg" color="white">
          PlaceTW
        </Heading>

        <Spacer />

        <Box>
          <Link as={RouterLink} to="/" color="white" mr={4}>
            Home
          </Link>
          <Link as={RouterLink} to="/gallery" color="white" mr={4}>
            Gallery
          </Link>
          <Link as={RouterLink} to="/translations" color="white" mr={4}>
            Translations
          </Link>
        </Box>
        <Box>
          <LanguageSwitcher />
        </Box>
      </Flex>
    </Box>
  );
};

export default Navbar;
