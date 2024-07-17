import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Collapse,
  Heading,
  Image,
  Link,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { ArtInfo } from "../types/art";
import ImageModal from "./image-modal";
import { FC, useState } from "react";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: FC<ArtCardProps> = ({ artPiece }) => {
  const { t } = useTranslation();
  const [showFullText, setShowFullText] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const toggleShowText = () => {
    setShowFullText(!showFullText);
  };

  const imageUrl = `/images/${artPiece.art_id}.png`;

  return (
    <>
      <Card>
        <CardBody>
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
              h="300px"
              w="300px"
              objectFit="cover"
              onClick={handleImageClick}
              src={imageUrl}
              borderRadius={8}
            />
          </Box>
          <Box p={4} pb={0}>
            <Stack>
              <Heading
                // eslint-disable-next-line react-hooks/rules-of-hooks
                color={useColorModeValue("gray.700", "white")}
                fontSize={"2xl"}
                fontFamily={"body"}
              >
                {artPiece.title}
              </Heading>
              <Text
                color={"green.500"}
                textTransform={"uppercase"}
                fontWeight={800}
                fontSize={"sm"}
                letterSpacing={1.1}
              >
                {artPiece.blurb}
              </Text>

              <Box dropShadow="inner">
                <Collapse startingHeight={60} in={showFullText}>
                  <Text color={"gray.500"}>{artPiece.desc}</Text>
                </Collapse>
              </Box>

              <Link onClick={toggleShowText} variant="link" cursor="pointer">
                <Text fontWeight="semibold">
                  {showFullText ? t("Show less") : t("Show more")}
                </Text>
              </Link>
            </Stack>
          </Box>
        </CardBody>
        <CardFooter pt={0}>
          <Box>
            {artPiece.links.map((link) => (
              <Link key={link} href={link} isExternal colorScheme="blue">
                <Tag m={1}>{new URL(link).hostname}</Tag>
              </Link>
            ))}
          </Box>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={imageUrl}
        altText={artPiece.desc}
      />
    </>
  );
};

export default ArtCard;
