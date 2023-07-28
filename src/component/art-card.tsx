import {
  Box,
  Heading,
  Image,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { ArtInfo } from "../types/art";
import ImageModal from "./image-modal";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: React.FC<ArtCardProps> = ({ artPiece }) => {
  const [showFullText, setShowFullText] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const maxTextLength = 100;

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
          <Text color={"gray.500"}>
            <Text>
              {/* Show either full or sliced description */}
              {showFullText
                ? artPiece.desc
                : artPiece.desc.slice(0, maxTextLength)}
              {/* Show "..." when not showing full text and text is too long */}
              {!showFullText && artPiece.desc.length > maxTextLength && "..."}
            </Text>

            {/* Show more/less */}
            {artPiece.desc.length > maxTextLength && (
              <Link onClick={toggleShowText} variant="link" cursor="pointer">
                {showFullText ? "Show less" : "Show more"}
              </Link>
            )}
          </Text>
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
