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
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { supabase } from "../../api/supabase";
import {
  databaseFetchColors,
  deleteColor,
  insertColor,
  removeSupabaseChannel,
  updateColor, // Updated import
} from "../../api/supabase/database";
import { Color } from "../../types/art-tool";
import ColorRow from "./color-row";

const ColorPaletteManager = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [newColor, setNewColor] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const toast = useToast();

  useEffect(() => {
    const fetchColors = async () => {
      const fetchedColors = await databaseFetchColors();
      setColors(fetchedColors);
    };

    fetchColors();

    const subscription = supabase
      .channel("public:art_tool_colors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_colors" },
        fetchColors,
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(subscription);
    };
  }, []);

  const moveColorUp = async (index: number) => {
    if (index > 0) {
      const updatedColors = [...colors];
      const temp = updatedColors[index - 1];
      updatedColors[index - 1] = updatedColors[index];
      updatedColors[index] = temp;

      setColors(updatedColors);
      await updateColorSortOrder(updatedColors);
    }
  };

  const moveColorDown = async (index: number) => {
    if (index < colors.length - 1) {
      const updatedColors = [...colors];
      const temp = updatedColors[index + 1];
      updatedColors[index + 1] = updatedColors[index];
      updatedColors[index] = temp;

      setColors(updatedColors);
      await updateColorSortOrder(updatedColors);
    }
  };

  const updateColorSortOrder = async (updatedColors: Color[]) => {
    try {
      await updateColorSortOrder(updatedColors);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update color sort order: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddColor = async () => {
    if (newColor && newColorName) {
      try {
        await insertColor(newColor, newColorName, colors.length + 1);
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
    newColorName: string,
  ) => {
    try {
      await updateColor(color.Color, newColor, newColorName);
      setColors(
        colors.map((c) =>
          c.Color === color.Color
            ? { ...c, Color: newColor, color_name: newColorName }
            : c,
        ),
      );
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
      setColors(colors.filter((c) => c.Color !== color));
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
          {colors.map((color, index) => (
            <ColorRow
              key={color.Color}
              color={color}
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
      <Flex mt={4}>
        <Input
          placeholder="Enter Hex Code"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          mr={2}
        />
        <Input
          placeholder="Enter Color Name"
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
          mr={2}
        />
        <Button
          onClick={handleAddColor}
          colorScheme="blue"
          leftIcon={<FaPlus />}
        >
          Add Color
        </Button>
      </Flex>
    </Box>
  );
};

export default ColorPaletteManager;
