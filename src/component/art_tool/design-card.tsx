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
import {
  faCloudUpload,
  faCodeMerge,
  faEye,
  faEyeSlash,
  faHeart,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useEffect, useState } from "react";
import { useUserContext } from "../../context/user-context";
import { DesignInfo } from "../../types/art-tool";
import ImageModal from "../image-modal";

interface DesignCardProps {
  design: DesignInfo;
  userId: string;
  userHandle: string;
}

const DesignCard: FC<DesignCardProps> = ({ design, userId, userHandle }) => {
  const { currentUser, rankNames, users } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("ArtPiece props:", design);
  }, [design]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const isAdminOrCreator =
    currentUser &&
    (currentUser.rank === "A" ||
      currentUser.rank === "B" ||
      currentUser.user_id === design.created_by_user_id);
  const isCreator =
    currentUser && currentUser.user_id === design.created_by_user_id;
  const canMerge =
    currentUser && (currentUser.rank === "A" || currentUser.rank === "B");

  const user = users.find((u) => u.user_id === userId);
  const rankName = user ? rankNames[user.rank] : "Unknown";

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
            />
            <Image
              alt={design.layer_name}
              fallbackSrc="https://via.placeholder.com/150"
              h="300px"
              w="300px"
              objectFit="cover"
              onClick={handleImageClick}
              src={
                design.layer_thumbnail ||
                "https://via.placeholder.com/300?text=No+Image"
              }
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
                {rankName} {userHandle}
              </Text>
              <Heading fontSize={"2xl"} fontFamily={"body"}>
                {design.layer_name}
              </Heading>
            </Stack>
          </Box>
        </CardBody>
        <CardFooter pt={0}>
          <Box display="flex" alignItems="center">
            <IconButton
              icon={<FontAwesomeIcon icon={faHeart} />}
              aria-label="Like"
            />
            <Text ml={2}>{design.likes_count} Likes</Text>
          </Box>
          <Box ml="auto">
            {isAdminOrCreator && (
              <IconButton
                icon={<FontAwesomeIcon icon={faTrash} />}
                aria-label="Delete"
                mr={2}
              />
            )}
            {isCreator && (
              <IconButton
                icon={<FontAwesomeIcon icon={faPen} />}
                aria-label="Edit"
                mr={2}
              />
            )}
            {isCreator && (
              <IconButton
                icon={<FontAwesomeIcon icon={faCloudUpload} />}
                aria-label="Upload"
                mr={2}
              />
            )}
            {canMerge && (
              <IconButton
                icon={<FontAwesomeIcon icon={faCodeMerge} />}
                aria-label="Merge"
              />
            )}
          </Box>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={
          design.layer_thumbnail ||
          "https://via.placeholder.com/300?text=No+Image"
        }
        altText={design.layer_name}
      />
    </>
  );
};

export default DesignCard;
