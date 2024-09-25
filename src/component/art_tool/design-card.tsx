// src/component/art_tool/design-card.tsx

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  Tooltip, // Import Tooltip
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import { FaCopy, FaEllipsisV, FaExchangeAlt, FaSave } from "react-icons/fa";
import {
  FaArrowsLeftRightToLine,
  FaEye,
  FaEyeSlash,
  FaHeart,
  FaImage,
  FaPen,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";
import {
  copyDesignCanvas,
  databaseDeleteDesign,
  likeDesign,
  unlikeDesign,
  updateDesignCanvas,
} from "../../api/supabase/database";
import { useUserContext } from "../../context/user-context";
import { Canvas, Design, Pixel } from "../../types/art-tool";
import ImageModal from "../image-modal";
import SetDesignCanvas from "./set-design-canvas";

interface DesignCardProps {
  design: Design;
  isEditing: boolean;
  inEditMode: boolean;
  onEdit: (designId: number) => boolean;
  onCancelEdit: () => void;
  onSelect: (designId: number) => void;
  onToggleVisibility: (designId: number, isVisible: boolean) => void;
  isVisible: boolean;
  onSubmitEdit: (designName: string) => void;
  onSetCanvas: (designId: number, canvasId: number) => void;
  onDeleted: (designId: number) => void;
  editedPixels: Pixel[];
}

const DesignCard: FC<DesignCardProps> = ({
  design,
  isEditing,
  inEditMode,
  onEdit,
  onCancelEdit,
  onSelect,
  onToggleVisibility,
  isVisible,
  onSubmitEdit,
  onSetCanvas,
  onDeleted,
  editedPixels,
}) => {
  const { currentUser, users, ranks } = useUserContext(); // Import users and ranks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? design.liked_by?.includes(currentUser.user_id) : false,
  );
  const [isSetCanvasPopupOpen, setIsSetCanvasPopupOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [designName, setDesignName] = useState(design.design_name || "");
  const toast = useToast();

  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const {
    isOpen: isUnsavedChangesDialogOpen,
    onOpen: onOpenUnsavedChangesDialog,
    onClose: onCloseUnsavedChangesDialog,
  } = useDisclosure();

  const cancelRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setIsLiked(design.liked_by?.includes(currentUser.user_id) ?? false);
    }
  }, [design.liked_by, currentUser]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleToggleVisibility = () => {
    const newVisibility = !isVisible;
    onToggleVisibility(design.id, newVisibility);
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      if (isLiked) {
        await unlikeDesign(design, currentUser.user_id);
        setIsLiked(false);
      } else {
        await likeDesign(design, currentUser.user_id);
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
    }
  };

  const handleDelete = async () => {
    try {
      await databaseDeleteDesign(design.id);
      onDeleted(design.id);
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
    }
    onCloseDeleteDialog();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (editedPixels && editedPixels.length > 0) {
        onOpenUnsavedChangesDialog();
      } else {
        onCancelEdit();
      }
    } else {
      onEdit(design.id);
    }
  };

  const handleConfirmExitEdit = () => {
    onCancelEdit();
    onCloseUnsavedChangesDialog();
  };

  const handleMoveToCanvas = () => {
    setIsCopying(false);
    setIsSetCanvasPopupOpen(true);
  };

  const handleCopyToCanvas = () => {
    setIsCopying(true);
    setIsSetCanvasPopupOpen(true);
  };

  const handleSetCanvasDecision = async (
    canvas: Canvas | null,
    copy: boolean,
  ) => {
    setIsSetCanvasPopupOpen(false);

    if (!canvas) return;

    try {
      const returnedDesign = copy
        ? await copyDesignCanvas(design.id, canvas.id)
        : await updateDesignCanvas(design.id, canvas.id);
      onSetCanvas(returnedDesign.id, canvas.id);

      toast({
        title: "Set Canvas for Design",
        description: `${canvas.canvas_name} has been set as the canvas for ${design.design_name}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add design to canvas.",
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
  const isCreator = currentUser && currentUser.user_id === design.created_by;

  // Get the creator's user data from the context
  const creator = users.find((user) => user.user_id === design.created_by);

  // Compute the creator's rank name
  const creatorRankName =
    ranks.find((rank) => rank.rank_id === creator?.rank)?.rank_name ||
    "Unknown";

  // Check for required fields
  if (!design.id || !design.design_name) {
    console.error("[DESIGN CARD] Missing required design data:", design);
    return null; // Skip rendering this card
  }

  return (
    <>
      <Card
        backgroundColor={isVisible ? "white" : "gray.100"}
        width="100%"
        position="relative"
        variant="outline"
      >
        <CardBody display="flex" padding="0">
          <Box
            height="auto"
            width="120px"
            position="relative"
            flex="none"
            borderRight="1px solid #ccc"
            overflow="hidden"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Tooltip label={isVisible ? "Hide Design" : "Show Design"}>
              <IconButton
                icon={isVisible ? <FaEye /> : <FaEyeSlash />}
                aria-label="Toggle Visibility"
                onClick={handleToggleVisibility}
                position="absolute"
                top="5px"
                left="5px"
                size="sm"
                backgroundColor="rgba(255, 255, 255, 0.8)"
                _hover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                border="1px"
                borderColor={isVisible ? "green.500" : "red.500"}
              />
            </Tooltip>
            <Tooltip label="Center on Design">
              <IconButton
                icon={<FaArrowsLeftRightToLine />}
                aria-label="Center on Design"
                onClick={() => onSelect(design.id)}
                position="absolute"
                top="5px"
                right="5px"
                size="sm"
                backgroundColor="rgba(255, 255, 255, 0.8)"
                _hover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                border="1px"
                isDisabled={!isVisible}
              />
            </Tooltip>
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
                  <FaImage size="50%" color="white" />
                </Box>
              }
              height="100%"
              objectFit="contain"
              onClick={handleImageClick}
              src={design.design_thumbnail || ""}
            />
            <Tooltip label={isLiked ? "Unlike" : "Like"}>
              <Button
                leftIcon={<FaHeart color={isLiked ? "red" : "gray"} />}
                onClick={handleLike}
                position="absolute"
                bottom="5px"
                left="5px"
                size="sm"
                backgroundColor="rgba(255, 255, 255, 0.8)"
                _hover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                border="1px"
                borderColor={isLiked ? "red.500" : "gray.500"}
              >
                {design.liked_by.length}
              </Button>
            </Tooltip>
          </Box>
          <Flex
            direction="column"
            justifyContent="space-between"
            p={2}
            width="100%"
            bg={isEditing ? "blue.100" : isVisible ? "white" : "gray.100"}
          >
            <Box>
              {isEditing ? (
                <Input
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  fontSize={"md"}
                  backgroundColor="white"
                />
              ) : (
                <Heading fontSize={"md"}>{design.design_name}</Heading>
              )}
              <Text color={"gray.600"} fontWeight={500} fontSize={"sm"}>
                {creatorRankName} {creator?.handle ?? "Unknown"}
              </Text>
            </Box>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              {isCreator && !inEditMode && (
                <Tooltip label="Edit Design">
                  <IconButton
                    icon={<FaPen />}
                    aria-label="Edit"
                    onClick={handleEditToggle}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                  />
                </Tooltip>
              )}
              {isEditing && (
                <>
                  <Tooltip label="Cancel Edit">
                    <IconButton
                      icon={<FaXmark />}
                      aria-label="Cancel"
                      onClick={handleEditToggle}
                      size="sm"
                    />
                  </Tooltip>
                  <Tooltip label="Save Changes">
                    <IconButton
                      icon={<FaSave />}
                      aria-label="Submit"
                      onClick={() => onSubmitEdit(designName)}
                      size="sm"
                    />
                  </Tooltip>
                </>
              )}

              {!inEditMode && isAdminOrCreator && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    icon={<FaEllipsisV />}
                    variant={isEditing ? "solid" : "outline"}
                    size="sm"
                    zIndex="base"
                  />
                  <MenuList>
                    {!isEditing && (
                      <MenuGroup title="Canvas Operations">
                        <MenuItem
                          icon={<FaCopy />}
                          onClick={handleCopyToCanvas}
                        >
                          Copy to Canvas
                        </MenuItem>
                        <MenuItem
                          icon={<FaExchangeAlt />}
                          onClick={handleMoveToCanvas}
                        >
                          Move to Canvas
                        </MenuItem>
                      </MenuGroup>
                    )}
                    <MenuDivider />
                    <MenuGroup title="Admin">
                      <MenuItem
                        icon={<FaTrash />}
                        onClick={onOpenDeleteDialog}
                        color={"red.500"}
                      >
                        Delete
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Menu>
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
      <SetDesignCanvas
        isOpen={isSetCanvasPopupOpen}
        copy={isCopying}
        onClose={() => setIsSetCanvasPopupOpen(false)}
        onSetCanvas={handleSetCanvasDecision}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Design
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this design? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <AlertDialog
        isOpen={isUnsavedChangesDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseUnsavedChangesDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Unsaved Changes
            </AlertDialogHeader>

            <AlertDialogBody>
              You have unsaved changes. Are you sure you want to exit without
              saving?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseUnsavedChangesDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmExitEdit} ml={3}>
                Exit Without Saving
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DesignCard;
