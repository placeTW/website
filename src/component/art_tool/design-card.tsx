import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  IconButton,
  Image,
  Text,
  useToast,
  Flex,
} from "@chakra-ui/react";
import {
  FaCloudArrowUp,
  FaCodeMerge,
  FaEye,
  FaEyeSlash,
  FaHeart,
  FaPen,
  FaTrash,
  FaArrowRightFromBracket,
  FaImage,
} from "react-icons/fa6";
import {
  databaseDeleteDesign,
  likeDesign,
  unlikeDesign,
  databaseMergeDesignIntoBaseline,
} from "../../api/supabase/database";
import { useUserContext } from "../../context/user-context";
import { Design } from "../../types/art-tool";
import ImageModal from "../image-modal";
import MergePopup from "./merge-popup";

interface DesignCardProps {
  design: Design;
  userId: string;
  userHandle: string;
  isEditing: boolean;
  onEdit: (designId: string) => boolean;
  onCancelEdit: () => void;
  onToggleVisibility: (designName: string, isVisible: boolean) => void;
  isVisible: boolean;
  onSubmitEdit: () => void;
}

const DesignCard: FC<DesignCardProps> = ({
  design,
  userId,
  userHandle,
  isEditing,
  onEdit,
  onCancelEdit,
  onToggleVisibility,
  isVisible,
  onSubmitEdit,
}) => {
  const { currentUser, rankNames, users } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? design.liked_by.includes(currentUser.user_id) : false
  );
  const [isMergePopupOpen, setIsMergePopupOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setIsLiked(currentUser ? design.liked_by.includes(currentUser.user_id) : false);
  }, [design.liked_by, currentUser]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleToggleVisibility = () => {
    const newVisibility = !isVisible;
    onToggleVisibility(design.design_name, newVisibility);
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
      await databaseDeleteDesign(design.id);
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

  const handleMerge = () => {
    setIsMergePopupOpen(true);
  };

  const handleMergeDecision = async (destination: string) => {
    setIsMergePopupOpen(false);

    if (destination === "cancel") {
      return;
    }

    try {
      console.log(`Merging design '${design.design_name}' into baseline '${destination}'.`);
      const mergeResult = await databaseMergeDesignIntoBaseline(design.id, destination);

      console.log("Merge result:", mergeResult);

      toast({
        title: "Merge Successful",
        description: `${design.design_name} has been merged into the ${destination} baseline.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error merging design:", error);

      toast({
        title: "Merge Failed",
        description: `Failed to merge design: ${errorMessage}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
      <Card
        bg="white" // Ensure the background of the entire card is white
        width="100%"
        maxWidth="4in"
        minWidth="3in"
        position="relative"
        height="130px"
      >
        <CardBody display="flex" padding="0">
          <Box
            height="100%"
            width="120px"
            position="relative"
            flex="none"
            borderRight="1px solid #ccc"
            overflow="hidden"
          >
            <IconButton
              icon={isVisible ? <FaEye /> : <FaEyeSlash />}
              aria-label="Toggle Visibility"
              onClick={handleToggleVisibility}
              position="absolute"
              top="5px"
              left="5px"
              zIndex={2}
              size="sm"
              backgroundColor="rgba(255, 255, 255, 0.8)"
              _hover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            />
            <Image
              alt={design.design_name}
              fallback={
                <Box
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  background="gray.100"
                >
                  <FaImage size="50%" color="white" /> {/* Inverted image icon */}
                </Box>
              }
              height="100%"
              width="120px"
              objectFit="cover"
              onClick={handleImageClick}
              src={design.design_thumbnail || ""}
            />
            <Button
              leftIcon={<FaHeart color={isLiked ? "red" : "gray"} />}
              onClick={handleLike}
              position="absolute"
              bottom="5px"
              left="5px"
              zIndex={2}
              size="sm"
              backgroundColor="rgba(255, 255, 255, 0.8)"
              _hover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            >
              {design.liked_by.length}
            </Button>
          </Box>
          <Flex
            direction="column"
            justifyContent="space-between"
            p={2}
            width="100%"
            bg={isEditing ? "blue.100" : "white"} // Only the right side turns blue
          >
            <Box>
              <Heading fontSize={"md"}>{design.design_name}</Heading>
              <Text color={"gray.600"} fontWeight={500} fontSize={"sm"}>
                {rankName} {userHandle}
              </Text>
            </Box>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              {isCreator && !isEditing && (
                <IconButton icon={<FaPen />} aria-label="Edit" onClick={handleEditToggle} size="sm" />
              )}
              {isEditing && (
                <>
                  <IconButton
                    icon={<FaArrowRightFromBracket />}
                    aria-label="Cancel"
                    onClick={handleEditToggle}
                    size="sm"
                  />
                  <IconButton
                    icon={<FaCloudArrowUp />}
                    aria-label="Submit"
                    onClick={onSubmitEdit}
                    size="sm"
                  />
                </>
              )}
              {canMerge && (
                <IconButton icon={<FaCodeMerge />} aria-label="Merge" onClick={handleMerge} size="sm" />
              )}
              {isAdminOrCreator && (
                <IconButton icon={<FaTrash />} aria-label="Delete" onClick={handleDelete} size="sm" />
              )}
            </Box>
          </Flex>
        </CardBody>
      </Card>
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={
          design.design_thumbnail ||
          "https://via.placeholder.com/100?text=No+Image"
        }
        altText={design.design_name}
      />
      <MergePopup
        isOpen={isMergePopupOpen}
        onClose={() => setIsMergePopupOpen(false)}
        onMerge={handleMergeDecision}
      />
    </>
  );
};

export default DesignCard;
