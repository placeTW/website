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
      const { data, error } = await supabase
        .from('art_tool_colors')
        .select('*')
        .order('color_sort', { ascending: true });

      if (error) {
        console.error('Error fetching colors:', error);
      } else {
        setColors(data as Color[]);
      }
    };

    fetchColors();

    const subscription = supabase
      .channel('public:art_tool_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_colors' }, fetchColors)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
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
      const { error } = await supabase.from('art_tool_colors').insert({
        Color: newColor,
        color_name: newColorName,
        color_sort: colors.length + 1,
      });

      if (error) {
        console.error('Error adding color:', error);
      } else {
        setNewColor('');
        setNewColorName('');
      }
    }
  };

  const handleRemoveColor = async (color: string) => {
    const { error } = await supabase.from('art_tool_colors').delete().eq('Color', color);

    if (error) {
      console.error('Error removing color:', error);
    }
  };

  const handleEditColor = async (color: Color, newColorCode: string, newColorName: string) => {
    if (newColorCode && newColorName) {
      const { error } = await supabase
        .from('art_tool_colors')
        .update({ Color: newColorCode, color_name: newColorName })
        .eq('Color', color.Color);

      if (error) {
        console.error('Error editing color:', error);
      }
    }
  };

  return (
    <Box p={4}>
      <Heading as="h3" size="md" mb={4}>
        Color Palette Manager
      </Heading>
      <Flex mb={4} align="center">
        <Input
          placeholder="Color code"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          mr={2}
          width="120px" // Adjust width
        />
        <Input
          placeholder="Color name"
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
          mr={2}
          width="150px" // Adjust width
        />
        <Button onClick={handleAddColor} leftIcon={<FaPlus />} size="sm">
          Add Color
        </Button>
      </Flex>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Preview</Th>
            <Th>Color Code</Th>
            <Th>Color Name</Th>
            <Th>Actions</Th>
            <Th>Order</Th>
          </Tr>
        </Thead>
        <Tbody>
          {colors.map((color, index) => (
            <ColorRow
              key={color.Color}
              index={index}
              color={color}
              totalColors={colors.length}
              moveColorUp={moveColorUp}
              moveColorDown={moveColorDown}
              handleEditColor={handleEditColor}
              handleRemoveColor={handleRemoveColor}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ColorPaletteManager;
