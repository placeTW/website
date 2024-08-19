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
} from "../../api/supabase/database";
import ColorRow from "./color-row";
import { useColorContext } from "../../context/color-context";
import { Color } from "../../types/art-tool"; // Ensure this import is correct

const ColorPaletteManager = () => {
  const { colors } = useColorContext(); // Updated to remove `updateColorSortOrder`
  const [newColor, setNewColor] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const toast = useToast();

  const moveColorUp = async (index: number) => {
    if (index > 0 && colors) {
      const updatedColors = [...colors];
      const temp = updatedColors[index - 1];
      updatedColors[index - 1] = updatedColors[index];
      updatedColors[index] = temp;

      // Handle color sort order update here if necessary
    }
  };

  const moveColorDown = async (index: number) => {
    if (index < (colors?.length || 0) - 1 && colors) {
      const updatedColors = [...colors];
      const temp = updatedColors[index + 1];
      updatedColors[index + 1] = updatedColors[index];
      updatedColors[index] = temp;

      // Handle color sort order update here if necessary
    }
  };

  const handleAddColor = async () => {
    if (newColor && newColorName) {
      try {
        await insertColor(newColor, newColorName, (colors?.length || 0) + 1);
        setNewColor("");
        setNewColorName("");
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to add color: ${
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
    newColorName: string
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
    try {
      await deleteColor(color);
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
  };

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
          {colors?.map((color, index) => (
            <ColorRow
              key={color.Color}
              color={{ ...color, color_sort: color.color_sort ?? 0 }} // Ensure color_sort is a number
              index={index}
              totalColors={colors.length}
              moveColorUp={moveColorUp}
              moveColorDown={moveColorDown}
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
