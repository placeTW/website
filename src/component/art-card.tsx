import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Heading,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { ArtInfo } from "../types/art";
import { useUserContext } from "../context/user-context";
import ImageModal from "./image-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faHeart, faEdit, faTrash, faCloudUploadAlt, faCodeMerge } from "@fortawesome/free-solid-svg-icons";

interface ArtCardProps {
  artPiece: ArtInfo;
}

const ArtCard: FC<ArtCardProps> = ({ artPiece }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edited, setEdited] = useState(false); // Assuming you have a way to track if a layer has been edited
  const [visible, setVisible] = useState(false);
  const { currentUser } = useUserContext();

  useEffect(() => {
    console.log("ArtPiece props:", artPiece);
  }, [artPiece]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  const isAdmiralOrCaptain = currentUser && (currentUser.rank === "A" || currentUser.rank === "B");
  const isCreator = currentUser && currentUser.user_id === artPiece.created_by_user_id;
  const isLoggedIn = currentUser && currentUser.rank !== "F"; // Assuming "F" is the rank for pirates

  return (
    <>
      <Card>
        <CardBody position="relative">
          <IconButton
            icon={<FontAwesomeIcon icon={visible ? faEye : faEyeSlash} />}
            aria-label="Toggle Visibility"
            variant="solid"
            colorScheme="blue"
            color="blue.500" // Blue color for the icon
            backgroundColor="white"
            borderRadius="50%"
            _hover={{ color: "white", backgroundColor: "blue.500" }} // Change on hover
            position="absolute"
            top={2}
            left={2}
            onClick={toggleVisibility}
          />
          <Box
            alignItems="center"
            cursor="pointer"
            display="flex"
            flex="1"
            justifyContent="center"
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
          <Box display="flex" alignItems="center">
            {isAdmiralOrCaptain && (
              <IconButton
                icon={<FontAwesomeIcon icon={faCodeMerge} />}
                aria-label="Merge"
                variant="ghost"
                colorScheme="blue"
              />
            )}
            {isCreator && (
              <IconButton
                icon={<FontAwesomeIcon icon={faEdit} />}
                aria-label="Edit"
                variant="ghost"
                colorScheme="blue"
                onClick={() => setEdited(true)} // Placeholder for edit action
              />
            )}
            {isCreator && edited && (
              <IconButton
                icon={<FontAwesomeIcon icon={faCloudUploadAlt} />}
                aria-label="Upload"
                variant="ghost"
                colorScheme="blue"
              />
            )}
            {(isCreator || isAdmiralOrCaptain) && (
              <IconButton
                icon={<FontAwesomeIcon icon={faTrash} />}
                aria-label="Delete"
                variant="ghost"
                colorScheme="red"
              />
            )}
            {isLoggedIn && (
              <Box display="flex" alignItems="center">
                <IconButton
                  icon={<FontAwesomeIcon icon={faHeart} />}
                  aria-label="Like"
                  variant="ghost"
                  colorScheme="blue"
                />
                <Text>{artPiece.likes_count}</Text>
              </Box>
            )}
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
