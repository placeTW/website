import { Box, Flex, IconButton, Link, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaDiscord, FaGithub, FaReddit } from "react-icons/fa";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <Box
      bg="blue.500"
      px={4}
      py={2}
    >
      <Text textAlign="center" color="white" mt={2} fontWeight="bold">
        {t("Join our community today!")}
      </Text>
      <Flex alignItems="center" justifyContent="center">
        <Link href="https://www.reddit.com/r/placeTW" isExternal>
          <IconButton
            icon={<FaReddit />}
            colorScheme="white"
            variant="ghost"
            aria-label="Reddit"
            fontSize="20px"
            mr={2}
          />
        </Link>
        <Link href="https://discord.gg/8xSQKCHSnT" isExternal>
          <IconButton
            icon={<FaDiscord />}
            colorScheme="white"
            variant="ghost"
            aria-label="Discord"
            fontSize="20px"
            mr={2}
          />
        </Link>
        <Link href="https://github.com/placeTW" isExternal>
          <IconButton
            icon={<FaGithub />}
            colorScheme="white"
            variant="ghost"
            aria-label="GitHub"
            fontSize="20px"
            mr={2}
          />
        </Link>
      </Flex>
    </Box>
  );
};

export default Footer;
