import React from "react";
import { Box, Flex, Spacer, Link, Heading } from "@chakra-ui/react";
import LanguageSwitcher from "./language-switcher";

const Navbar = () => {
  return (
    <Box bg="blue.500" px={4} py={2}>
      <Flex alignItems="center" maxW="xxl">
        <Heading as="h1" size="lg" color="white">
          PlaceTW
        </Heading>

        <Spacer />

        <Box>
          <Link href="/" color="white" mr={4}>
            Home
          </Link>
          <Link href="/gallery" color="white" mr={4}>
            Gallery
          </Link>
          <Link href="#" color="white" mr={4}>
            About
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
