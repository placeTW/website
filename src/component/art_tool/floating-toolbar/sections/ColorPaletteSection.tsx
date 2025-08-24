import React from 'react';
import {
  Box,
  Tooltip,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { CLEAR_ON_DESIGN } from '../../../viewport/constants';

export interface Color {
  Color: string;
  color_sort: number | null;
  color_name: string;
}

export interface ColorPaletteSectionProps {
  colors: Color[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  onColorDoubleClick?: (color: string) => void;
  isVertical?: boolean;
}

export const ColorPaletteSection: React.FC<ColorPaletteSectionProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  onColorDoubleClick,
  isVertical = false,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const ColorSwatch: React.FC<{ color: Color; isSelected: boolean }> = ({ 
    color, 
    isSelected 
  }) => {
    const isTransparent = color.Color === CLEAR_ON_DESIGN;
    
    return (
      <Tooltip 
        label={
          <Box textAlign="center">
            <Text fontWeight="semibold">{color.color_name}</Text>
            <Text fontSize="xs" fontFamily="mono">{color.Color}</Text>
          </Box>
        }
        placement={isVertical ? 'right' : 'top'}
      >
        <Box
          width="32px"
          height="32px"
          borderRadius="md"
          border="2px solid"
          borderColor={isSelected ? 'blue.500' : borderColor}
          cursor="pointer"
          onClick={() => onColorSelect(color.Color)}
          onDoubleClick={() => onColorDoubleClick?.(color.Color)}
          position="relative"
          overflow="hidden"
          transition="all 0.2s"
          _hover={{
            transform: 'scale(1.1)',
            borderColor: isSelected ? 'blue.600' : 'gray.400',
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
        >
          {isTransparent ? (
            // Checkerboard pattern for transparent
            <Box
              width="100%"
              height="100%"
              backgroundImage="repeating-conic-gradient(#e2e8f0 0% 25%, transparent 0% 50%)"
              backgroundSize="8px 8px"
            />
          ) : (
            <Box
              width="100%"
              height="100%"
              backgroundColor={color.Color}
            />
          )}
          
          {/* Selection indicator */}
          {isSelected && (
            <Box
              position="absolute"
              top="2px"
              right="2px"
              width="8px"
              height="8px"
              borderRadius="full"
              backgroundColor="blue.500"
              border="1px solid white"
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  const Container = isVertical ? VStack : HStack;

  return (
    <Container spacing={1} align="center" wrap="wrap">
      {colors.map((color) => (
        <ColorSwatch
          key={color.Color}
          color={color}
          isSelected={selectedColor === color.Color}
        />
      ))}
    </Container>
  );
};

export default ColorPaletteSection;