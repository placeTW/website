import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import {
  deleteColor,
  insertColor,
  updateColor,
  updateColorSortOrder,
} from "../../api/supabase/database";
import { useColorContext } from "../../context/color-context";
import { Color } from "../../types/art-tool";
import ColorRow from "./color-row";

const ColorPaletteManager = () => {
  const { colors, setColors } = useColorContext(); // Get colors and setter from context
  const [newColor, setNewColor] = useState<string>("");
  const [newColorName, setNewColorName] = useState<string>("");
  const toast = useToast();

  const handleAddColor = async () => {
    if (newColor && newColorName && colors) {
      try {
        await insertColor(newColor, newColorName, colors.length + 1); // Ensure colors is non-null
        setNewColor("");
        setNewColorName("");
      } catch (error) {
        toast({
          title: "Error",
        description: `Failed to add color: 
            (error as Error).message || error
          }`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditColor = async (
    color: Color,
    newColor: string,
    newColorName: string,
  ) => {
    try {
      await updateColor(color.Color, newColor, newColorName);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update color: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveColor = async (color: string) => {
    if (colors) {
      try {
        await deleteColor(color);

        // Update sort order after deletion
        const updatedColors = colors.filter((c) => c.Color !== color);
        await updateColorSortOrder(updatedColors);

        // Update the colors in the context
        setColors(updatedColors);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete color: ${
            (error as Error).message || error
          }`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleMoveColor = async (index: number, direction: "up" | "down") => {
    if (!colors || index < 0 || index >= colors.length) return;

    const swapWithIndex = direction === "up" ? index - 1 : index + 1;

    if (swapWithIndex < 0 || swapWithIndex >= colors.length) return;

    const updatedColors = [...colors];
    const currentColor = updatedColors[index];
    const swapWithColor = updatedColors[swapWithIndex];

    // Swap their sort orders in the list
    updatedColors[index] = {
      ...swapWithColor,
      color_sort: currentColor.color_sort,
    };
    updatedColors[swapWithIndex] = {
      ...currentColor,
      color_sort: swapWithColor.color_sort,
    };

    try {
      // Update sort order in the database
      await updateColorSortOrder(updatedColors);

      // Update the colors in the context
      setColors(updatedColors);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reorder colors: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!colors) {
    return <div>Loading...</div>; // Fallback UI while colors are being fetched
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        Color Palette Manager
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Color</Th>
            <Th>Hex Code</Th>
            <Th>Name</Th>
            <Th>Actions</Th>
            <Th>Order</Th>
          </Tr>
        </Thead>
        <Tbody>
          {colors.map((color, index) => (
            <ColorRow
              key={color.Color}
              color={color}
              index={index}
              totalColors={colors.length}
              moveColorUp={() => handleMoveColor(index, "up")}
              moveColorDown={() => handleMoveColor(index, "down")}
              handleEditColor={handleEditColor}
              handleRemoveColor={handleRemoveColor}
            />
          ))}
        </Tbody>
      </Table>
      <Flex mt={4} justifyContent="space-between" alignItems="center">
        <Input
          placeholder="Enter Hex Code"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          mr={2}
          flex="1"
        />
        <Input
          placeholder="Enter Color Name"
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
          mr={2}
          flex="1"
        />
        <Button
          onClick={handleAddColor}
          colorScheme="blue"
          leftIcon={<FaPlus />}
          minWidth="120px"
        >
          Add Color
        </Button>
      </Flex>
    </Box>
  );
};

export default ColorPaletteManager;
