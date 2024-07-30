import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Image,
  Stack,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { ArtInfo } from "../types/art";
import ImageModal from "./image-modal";
import { useUserContext } from "../context/user-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faTrash, faPen, faCodeMerge, faEye, faEyeSlash, faCloudUpload } from "@fortawesome/free-solid-svg-icons";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: FC<ArtCardProps> = ({ artPiece }) => {
  const { currentUser } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("ArtPiece props:", artPiece);
  }, [artPiece]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const isAdminOrCreator = currentUser && (currentUser.rank === "A" || currentUser.rank === "B" || currentUser.user_id === artPiece.created_by_user_id);
  const isCreator = currentUser && currentUser.user_id === artPiece.created_by_user_id;
  const canMerge = currentUser && (currentUser.rank === "A" || currentUser.rank === "B");

  return (
    <>
      <Card>
        <CardBody>
          <Box
            position="relative"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <IconButton
              icon={<FontAwesomeIcon icon={isVisible ? faEye : faEyeSlash} />}
              aria-label="Toggle Visibility"
              onClick={handleToggleVisibility}
              position="absolute"
              top="5px"
              left="5px"
              background="white"
              color="blue.500"
            />
            <Image
              alt={artPiece.layer_name}
              fallbackSrc="https://via.placeholder.com/150"
              h="300px"
              w="300px"
              objectFit="cover"
              onClick={handleImageClick}
              src={artPiece.layer_thumbnail || 'https://via.placeholder.com/300?text=No+Image'}
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
          <Box display="flex" alignItems="center">
            <IconButton icon={<FontAwesomeIcon icon={faHeart} />} aria-label="Like" />
            <Text ml={2}>{artPiece.likes_count} Likes</Text>
          </Box>
          <Box ml="auto">
            {isAdminOrCreator && (
              <IconButton icon={<FontAwesomeIcon icon={faTrash} />} aria-label="Delete" mr={2} />
            )}
            {isCreator && (
              <IconButton icon={<FontAwesomeIcon icon={faPen} />} aria-label="Edit" mr={2} />
            )}
            {isCreator && (
              <IconButton icon={<FontAwesomeIcon icon={faCloudUpload} />} aria-label="Upload" mr={2} />
            )}
            {canMerge && (
              <IconButton icon={<FontAwesomeIcon icon={faCodeMerge} />} aria-label="Merge" />
            )}
          </Box>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={artPiece.layer_thumbnail || 'https://via.placeholder.com/300?text=No+Image'}
        altText={artPiece.layer_name}
      />
    </>
  );
};

export default ArtCard;
