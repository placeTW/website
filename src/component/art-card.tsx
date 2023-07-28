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

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: React.FC<ArtCardProps> = ({ artPiece }) => {
  const [showFullText, setShowFullText] = React.useState(false);
  const maxTextLength = 100;

  const toggleShowText = () => {
    setShowFullText(!showFullText);
  };

  return (
    <Box boxShadow="2xl" overflow="hidden" rounded="md">
      {/* Image */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        <Image
          alt={artPiece.art_id}
          fallbackSrc="https://via.placeholder.com/200"
          h="200px"
          objectFit="cover"
          src={`/images/${artPiece.art_id}.png`}
        />
      </Box>

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
    </Box>
  );
};

export default ArtCard;
