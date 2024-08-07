import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
} from '@chakra-ui/react';
import { supabase } from '../../api/supabase';
import { FaPen, FaTrash, FaPlus, FaAngleUp, FaAngleDown } from 'react-icons/fa6';
import {
  databaseFetchColors,
  insertColor,
  deleteColor,
  removeSupabaseChannel, // Updated import
} from '../../api/supabase/database';

interface Color {
  Color: string;
  color_sort: number;
  color_name: string;
}

const ColorRow = ({
  color,
  index,
  totalColors,
  moveColorUp,
  moveColorDown,
  handleEditColor,
  handleRemoveColor,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedColor, setEditedColor] = useState(color.Color);
  const [editedColorName, setEditedColorName] = useState(color.color_name);

  const handleSave = () => {
    handleEditColor(color, editedColor, editedColorName);
    setIsEditing(false);
  };

  return (
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
          aria-label="Edit"
          icon={<FaPen />}
          onClick={() => setIsEditing(!isEditing)}
          mr={2}
        />
        <IconButton
          aria-label="Delete"
          icon={<FaTrash />}
          onClick={() => handleRemoveColor(color.Color)}
        />
      </Td>
      <Td>
        <IconButton
          aria-label="Move Up"
          icon={<FaAngleUp />}
          onClick={() => moveColorUp(index)}
          isDisabled={index === 0}
          mr={2}
        />
        <IconButton
          aria-label="Move Down"
          icon={<FaAngleDown />}
          onClick={() => moveColorDown(index)}
          isDisabled={index === totalColors - 1}
        />
      </Td>
    </Tr>
  );
};

const ColorPaletteManager = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newColorName, setNewColorName] = useState('');

  useEffect(() => {
    const fetchColors = async () => {
      const fetchedColors = await databaseFetchColors();
      setColors(fetchedColors as Color[]);
    };

    fetchColors();

    const subscription = supabase
      .channel('public:art_tool_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_colors' }, fetchColors)
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
    for (let i = 0; i < updatedColors.length; i++) {
      await supabase
        .from('art_tool_colors')
        .update({ color_sort: i + 1 })
        .eq('Color', updatedColors[i].Color);
    }
  };

  const handleAddColor = async () => {
    if (newColor && newColorName) {
      await insertColor(newColor, newColorName, colors.length + 1);
      setNewColor('');
      setNewColorName('');
    }
  };

  const handleEditColor = async (color: Color, newColor: string, newColorName: string) => {
    const { error } = await supabase
      .from('art_tool_colors')
      .update({ Color: newColor, color_name: newColorName })
      .eq('Color', color.Color);

    if (error) {
      console.error('Error editing color:', error);
    } else {
      setColors(
        colors.map((c) =>
          c.Color === color.Color ? { ...c, Color: newColor, color_name: newColorName } : c
        )
      );
    }
  };

  const handleRemoveColor = async (color: string) => {
    await deleteColor(color);
    setColors(colors.filter((c) => c.Color !== color));
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
        <Button onClick={handleAddColor} colorScheme="blue" leftIcon={<FaPlus />}>
          Add Color
        </Button>
      </Flex>
    </Box>
  );
};

export default ColorPaletteManager;
