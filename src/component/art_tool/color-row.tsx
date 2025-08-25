import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, IconButton, Input, Td, Tr, useDisclosure } from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleDown, FaAngleUp, FaPen, FaTrash } from "react-icons/fa6";
import { Color } from "../../types/art-tool";

interface ColorRowProps {
  color: Color;
  index: number;
  totalColors: number;
  moveColorUp: (index: number) => void;
  moveColorDown: (index: number) => void;
  handleEditColor: (
    color: Color,
    newColor: string,
    newColorName: string
  ) => void;
  handleRemoveColor: (color: string) => void;
}

const ColorRow: FC<ColorRowProps> = ({
  color,
  index,
  totalColors,
  moveColorUp,
  moveColorDown,
  handleEditColor,
  handleRemoveColor,
}: ColorRowProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedColor, setEditedColor] = useState(color.Color);
  const [editedColorName, setEditedColorName] = useState(color.color_name);

  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();
  const cancelRef = useRef(null);

  // Effect to log changes in props
  useEffect(() => {
    setEditedColor(color.Color);
    setEditedColorName(color.color_name);
  }, [color]);

  const handleSave = () => {
    handleEditColor(color, editedColor, editedColorName);
    setIsEditing(false);
  };

  const handleDelete = () => {
    handleRemoveColor(color.Color);
    onCloseDeleteDialog();
  }

  return (
    <>
      <Tr>
        <Td>
          <Box
            w="24px"
            h="24px"
            bg={editedColor}
            border="1px solid"
            borderColor="gray.200"
          />
        </Td>
        <Td>
          {isEditing ? (
            <Input
              value={editedColor}
              onChange={(e) => setEditedColor(e.target.value)}
              onBlur={handleSave}
              size="sm"
              width="120px" // Adjust width
            />
          ) : (
            editedColor
          )}
        </Td>
        <Td>
          {isEditing ? (
            <Input
              value={editedColorName}
              onChange={(e) => setEditedColorName(e.target.value)}
              onBlur={handleSave}
              size="sm"
              width="150px" // Adjust width
            />
          ) : (
            editedColorName
          )}
        </Td>
        <Td>
          <IconButton
            aria-label={t("Edit")}
            icon={<FaPen />}
            onClick={() => setIsEditing(!isEditing)}
            mr={2}
          />
          <IconButton
            aria-label={t("Delete")}
            icon={<FaTrash />}
            onClick={onOpenDeleteDialog}
          />
        </Td>
        <Td>
          <IconButton
            aria-label={t("Move Up")}
            icon={<FaAngleUp />}
            onClick={() => moveColorUp(index)}
            isDisabled={index === 0}
            mr={2}
          />
          <IconButton
            aria-label={t("Move Down")}
            icon={<FaAngleDown />}
            onClick={() => moveColorDown(index)}
            isDisabled={index === totalColors - 1}
          />
        </Td>
      </Tr>
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t("Delete Design")}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t("Are you sure you want to delete this design? This action cannot be undone.")}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteDialog}>
                {t("Cancel")}
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                {t("Delete")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ColorRow;
