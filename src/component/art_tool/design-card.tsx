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
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import {
  FaCopy,
  FaEllipsisVertical,
  FaArrowRightArrowLeft as FaExchangeAlt,
  FaArrowsLeftRightToLine,
  FaEye,
  FaEyeSlash,
  FaHeart,
  FaImage,
  FaPen,
  FaTrash,
  FaXmark,
  FaArrowUp,
  FaArrowDown,
  FaUpDownLeftRight,
} from "react-icons/fa6";
import {
  copyDesignCanvas,
  databaseDeleteDesign,
  likeDesign,
  unlikeDesign,
  updateDesignCanvas,
} from "../../api/supabase/database";
import { useUserContext } from "../../context/user-context";
import { Canvas, Design } from "../../types/art-tool";
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
  onSetCanvas: (designId: number, canvasId: number) => void;
  onDeleted: (designId: number) => void;
  onMoveDesignUp: (designId: number) => void;
  onMoveDesignDown: (designId: number) => void;
  onMoveDesignToIndex: (designId: number, targetIndex: number) => void;
  currentIndex: number;
  totalDesigns: number;
  isDragModeEnabled: boolean;
  onToggleDragMode: (designId: number) => void;
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
  onSetCanvas,
  onDeleted,
  onMoveDesignUp,
  onMoveDesignDown,
  onMoveDesignToIndex,
  currentIndex,
  totalDesigns,
  isDragModeEnabled,
  onToggleDragMode,
}) => {
  const { currentUser, users, ranks } = useUserContext(); // Import users and ranks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUser ? design.liked_by?.includes(currentUser.user_id) : false,
  );
  const [isSetCanvasPopupOpen, setIsSetCanvasPopupOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [newIndex, setNewIndex] = useState<string>("");
  const toast = useToast();

  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const {
    isOpen: isIndexDialogOpen,
    onOpen: onOpenIndexDialog,
    onClose: onCloseIndexDialog,
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
    if (!isAdminOrCreator) {
      throw new Error("User not allowed to delete design")
    }
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
      onCancelEdit();
    } else {
      onEdit(design.id);
    }
  };

  const handleDragModeToggle = () => {
    onToggleDragMode(design.id);
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

  const handleMoveToIndex = () => {
    const targetIndex = parseInt(newIndex) - 1; // Convert from 1-based to 0-based
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= totalDesigns) {
      toast({
        title: "Invalid Index",
        description: `Please enter a number between 1 and ${totalDesigns}.`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (targetIndex === currentIndex) {
      onCloseIndexDialog();
      setNewIndex("");
      return;
    }

    onMoveDesignToIndex(design.id, targetIndex);
    onCloseIndexDialog();
    setNewIndex("");
  };

  const handleIndexDialogOpen = () => {
    setNewIndex((currentIndex + 1).toString());
    onOpenIndexDialog();
  };

  const isAdmin = !!currentUser && ["A", "B"].includes(currentUser.rank);
  const isCreator = !!currentUser && currentUser.user_id === design.created_by;
  const isAdminOrCreator = isAdmin || isCreator;

  // Get the creator's user data from the context
  const creator = users.find((user) => user.user_id === design.created_by);

  // Compute the creator's rank name
  const creatorRankName =
    ranks.find((rank) => rank.rank_id === creator?.rank)?.rank_name ||
    "Unknown";

  // Check for required fields
  if (!design.id) {
    console.error("[DESIGN CARD] Missing required design data:", design);
    return null; // Skip rendering this card
  }

  return (
    <>
      <Card
        backgroundColor={isVisible ? "white" : "gray.100"}
        width="100%"
        minHeight="8rem"
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
              alt={design.design_name ?? "(Untitled artwork)"}
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
            bg={isEditing ? "blue.100" : isDragModeEnabled ? "orange.100" : isVisible ? "white" : "gray.100"}
          >
            <Box>
              <Heading fontSize={"md"}>{design.design_name || "(Untitled Artwork)"}</Heading>
              <Text color={"gray.600"} fontWeight={500} fontSize={"sm"}>
                {creatorRankName} {creator?.handle ?? "Unknown"}
              </Text>
              {isEditing && (
                <Text fontSize={"xs"} color="blue.600" fontWeight={500}>
                  Currently editing - use toolbar to save
                </Text>
              )}
              {isDragModeEnabled && !isEditing && (
                <Text fontSize={"xs"} color="orange.600" fontWeight={500}>
                  Drag mode enabled - drag in viewport to move
                </Text>
              )}
            </Box>
            <Flex direction="row" justifyContent="space-between">
              {isAdmin ? (<Flex gap={1} alignItems="center">
                <IconButton
                  icon={<FaArrowUp />}
                  variant="outline"
                  aria-label="Move Design Up in Order"
                  onClick={() => onMoveDesignUp(design.id)}
                  size="xs"
                  isDisabled={!isVisible || currentIndex === 0}
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleIndexDialogOpen}
                  isDisabled={!isVisible}
                  minWidth="auto"
                  px={2}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {currentIndex + 1}
                </Button>
                <IconButton
                  icon={<FaArrowDown />}
                  variant="outline"
                  aria-label="Move Design Down in Order"
                  onClick={() => onMoveDesignDown(design.id)}
                  size="xs"
                  isDisabled={!isVisible || currentIndex === totalDesigns - 1}
                />
              </Flex>) : <Box />}
              <Flex gap={2}>
                {isCreator && !inEditMode && (
                  <Tooltip label={isEditing ? "Stop Editing" : "Edit Design"}>
                    <IconButton
                      icon={isEditing ? <FaXmark /> : <FaPen />}
                      aria-label={isEditing ? "Stop Editing" : "Edit Design"}
                      onClick={handleEditToggle}
                      size="sm"
                      colorScheme={isEditing ? "red" : "blue"}
                      variant={isEditing ? "solid" : "outline"}
                    />
                  </Tooltip>
                )}

                {isAdminOrCreator && !inEditMode && !isEditing && (
                  <Tooltip label={isDragModeEnabled ? "Disable Drag Mode" : "Enable Drag Mode"}>
                    <IconButton
                      icon={<FaUpDownLeftRight />}
                      aria-label={isDragModeEnabled ? "Disable Drag Mode" : "Enable Drag Mode"}
                      onClick={handleDragModeToggle}
                      size="sm"
                      colorScheme={isDragModeEnabled ? "orange" : "gray"}
                      variant={isDragModeEnabled ? "solid" : "outline"}
                    />
                  </Tooltip>
                )}

                {!inEditMode && isAdminOrCreator && (
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<FaEllipsisVertical />}
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
              </Flex>
            </Flex>
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
        isOpen={isIndexDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseIndexDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Move Design to Position
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={2}>
                Enter the position where you want to move "{design.design_name}":
              </Text>
              <Input
                value={newIndex}
                onChange={(e) => setNewIndex(e.target.value)}
                placeholder={`1-${totalDesigns}`}
                type="number"
                min="1"
                max={totalDesigns}
              />
              <Text fontSize="sm" color="gray.600" mt={2}>
                Current position: {currentIndex + 1} of {totalDesigns}
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseIndexDialog}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleMoveToIndex} ml={3}>
                Move
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DesignCard;
