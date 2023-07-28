import {
  Box,
  Collapse,
  Heading,
  Image,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ArtInfo } from "../types/art";
import ImageModal from "./image-modal";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: React.FC<ArtCardProps> = ({ artPiece }) => {
  const { t } = useTranslation();
  const [showFullText, setShowFullText] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const toggleShowText = () => {
    setShowFullText(!showFullText);
  };

  const imageUrl = `/images/${artPiece.art_id}.png`;

  return (
    <Box boxShadow="2xl" overflow="hidden" rounded="md">
      {/* Top image */}
      <Box
        _hover={{ transform: "scale(1.1)" }} // zoom-in effect on hover
        alignItems="center"
        cursor="pointer"
        display="flex"
        flex="1"
        justifyContent="center"
        transition="transform 1s" // zoom-in/out animation transition
      >
        <Image
          alt={artPiece.desc}
          fallbackSrc="https://via.placeholder.com/200"
          h="200px"
          objectFit="cover"
          onClick={handleImageClick}
          src={imageUrl}
        />
      </Box>

      {/* Bottom */}
      <Box p={6}>
        <Stack>
          {/* Title */}
          <Text
            color={"green.500"}
            textTransform={"uppercase"}
            fontWeight={800}
            fontSize={"sm"}
            letterSpacing={1.1}
          >
            {artPiece.title}
          </Text>

          {/* Blurb */}
          <Heading
            // eslint-disable-next-line react-hooks/rules-of-hooks
            color={useColorModeValue("gray.700", "white")}
            fontSize={"2xl"}
            fontFamily={"body"}
          >
            {artPiece.blurb}
          </Heading>

          {/* Desc */}
          <Collapse startingHeight={60} in={showFullText}>
            <Text color={"gray.500"}>{artPiece.desc}</Text>
          </Collapse>

          {/* Show more/less */}
          <Link onClick={toggleShowText} variant="link" cursor="pointer">
            <Text fontWeight="semibold">
              {showFullText ? t("Show less") : t("Show more")}
            </Text>
          </Link>
        </Stack>
      </Box>

      {/* Image modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={imageUrl}
        altText={artPiece.desc}
      />
    </Box>
  );
};

export default ArtCard;
