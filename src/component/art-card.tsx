import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { ArtInfo } from "../types/art";
import ImageModal from "./image-modal";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: FC<ArtCardProps> = ({ artPiece }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log("ArtPiece props:", artPiece);
  }, [artPiece]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardBody>
          <Box
            _hover={{ transform: "scale(1.1)" }}
            alignItems="center"
            cursor="pointer"
            display="flex"
            flex="1"
            justifyContent="center"
            transition="transform 1s"
          >
            <Image
              alt={artPiece.layer_name}
              fallbackSrc="https://via.placeholder.com/150"
              h="300px"
              w="300px"
              objectFit="cover"
              onClick={handleImageClick}
              src={artPiece.layer_thumbnail}
              borderRadius={8}
            />
          </Box>
          <Box p={4} pb={0}>
            <Stack>
              <Text
                color={"green.500"}
                textTransform={"uppercase"}
                fontWeight={800}
                fontSize={"sm"}
                letterSpacing={1.1}
              >
                {artPiece.rank_name} {artPiece.handle}
              </Text>
              <Heading fontSize={"2xl"} fontFamily={"body"}>
                {artPiece.layer_name}
              </Heading>
            </Stack>
          </Box>
        </CardBody>
        <CardFooter pt={0}>
          <Box>
            <Text fontWeight="semibold">
              {artPiece.likes_count} Likes
            </Text>
          </Box>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={artPiece.layer_thumbnail}
        altText={artPiece.layer_name}
      />
    </>
  );
};

export default ArtCard;
