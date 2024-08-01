// ./src/component/art_tool/design-card.tsx

import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Heading,
  IconButton,
  Image,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import {
  FaCloudArrowUp,
  FaCodeMerge,
  FaEye,
  FaEyeSlash,
  FaHeart,
  FaPen,
  FaTrash,
  FaSquareXmark,
} from "react-icons/fa6";
import {
  databaseDeleteLayerAndPixels,
  likeDesign,
  unlikeDesign,
} from "../../api/supabase/database";
import { useUserContext } from "../../context/user-context";
import { DesignInfo } from "../../types/art-tool";
import ImageModal from "../image-modal";

interface DesignCardProps {
  design: DesignInfo;
  userId: string;
  userHandle: string;
  isEditing: boolean;
  onEdit: (designId: string) => boolean;
  onCancelEdit: () => void;
}

const DesignCard: FC<DesignCardProps> = ({
  design,
  userId,
  userHandle,
  isEditing,
  onEdit,
  onCancelEdit,
}) => {
  const { currentUser, rankNames, users } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? design.liked_by.includes(currentUser.user_id) : false
  );
  const toast = useToast();

  useEffect(() => {
    setIsLiked(currentUser ? design.liked_by.includes(currentUser.user_id) : false);
  }, [design.liked_by, currentUser]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        await unlikeDesign(design.id, currentUser.user_id);
        setIsLiked(false);
      } else {
        await likeDesign(design.id, currentUser.user_id);
        setIsLiked(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating your like.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error liking/unliking design:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await databaseDeleteLayerAndPixels(design.design_name);
      toast({
        title: "Design deleted.",
        description: `${design.design_name} has been removed successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the design.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error deleting design:", error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      onCancelEdit(); // Cancel edit mode
    } else {
      if (onEdit(design.id)) {
        // Enter edit mode only if allowed
      }
    }
  };

  const isAdminOrCreator =
    currentUser &&
    (currentUser.rank === "A" ||
      currentUser.rank === "B" ||
      currentUser.user_id === design.created_by);
  const isCreator =
    currentUser && currentUser.user_id === design.created_by;
  const canMerge =
    currentUser && (currentUser.rank === "A" || currentUser.rank === "B");

  const user = users.find((u) => u.user_id === userId);
  const rankName = user ? rankNames[user.rank] : "Unknown";

  return (
    <>
      <Card bg={isEditing ? "blue.100" : "white"}>
        <CardBody>
          <Box
            position="relative"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <IconButton
              icon={isVisible ? <FaEye /> : <FaEyeSlash />}
              aria-label="Toggle Visibility"
              onClick={handleToggleVisibility}
              position="absolute"
              top="5px"
              left="5px"
            />
            <Image
              alt={design.design_name}
              fallbackSrc="https://via.placeholder.com/150"
              h="300px"
              w="300px"
              objectFit="cover"
              onClick={handleImageClick}
              src={
                design.design_thumbnail ||
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
                {design.design_name}
              </Heading>
            </Stack>
          </Box>
        </CardBody>
        <CardFooter
          pt={0}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" flexDirection="row" alignItems="center">
            <Button
              leftIcon={<FaHeart color={isLiked ? "red" : "gray"} />}
              onClick={handleLike}
            >
              {design.liked_by.length}
            </Button>
          </Box>
          <Box display="flex" gap={2}>
            {isAdminOrCreator && (
              <IconButton
                icon={<FaTrash />}
                aria-label="Delete"
                onClick={handleDelete}
              />
            )}
            {isCreator && !isEditing && (
              <IconButton
                icon={<FaPen />}
                aria-label="Edit"
                onClick={handleEditToggle}
              />
            )}
            {isEditing && (
              <>
                <IconButton
                  icon={<FaSquareXmark />}
                  aria-label="Cancel"
                  onClick={handleEditToggle}
                />
                <IconButton
                  icon={<FaCloudArrowUp />}
                  aria-label="Submit"
                />
              </>
            )}
            {canMerge && (
              <IconButton icon={<FaCodeMerge />} aria-label="Merge" />
            )}
          </Box>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={
          design.design_thumbnail ||
          "https://via.placeholder.com/300?text=No+Image"
        }
        altText={design.design_name}
      />
    </>
  );
};

export default DesignCard;
