import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Select,
  useColorModeValue,
  Badge,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { ExtractedColor, suggestColorMappings } from '../../../../utils/pngUtils';

export interface ColorMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pngColors: ExtractedColor[];
  availableColors: { Color: string; color_name: string; color_sort: number | null }[];
  onConfirm: (colorMapping: Map<string, string>, insertPosition: { x: number; y: number }) => void;
  imageWidth: number;
  imageHeight: number;
}

interface ColorMappingRow {
  pngColor: string;
  selectedColor: string;
  count: number;
}

export const ColorMappingDialog: React.FC<ColorMappingDialogProps> = ({
  isOpen,
  onClose,
  pngColors,
  availableColors,
  onConfirm,
  imageWidth,
  imageHeight,
}) => {
  const [colorMappings, setColorMappings] = useState<Map<string, string>>(new Map());
  const [insertX, setInsertX] = useState(0);
  const [insertY, setInsertY] = useState(0);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize with suggested mappings
  useEffect(() => {
    if (pngColors.length > 0 && availableColors.length > 0) {
      const suggested = suggestColorMappings(pngColors, availableColors);
      setColorMappings(suggested);
    }
  }, [pngColors, availableColors]);

  const handleColorChange = useCallback((pngColor: string, selectedColor: string) => {
    setColorMappings(prev => {
      const newMap = new Map(prev);
      newMap.set(pngColor, selectedColor);
      return newMap;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(colorMappings, { x: insertX, y: insertY });
  }, [colorMappings, insertX, insertY, onConfirm]);

  const ColorSwatch: React.FC<{ color: string; size?: string }> = ({ color, size = '24px' }) => (
    <Box
      width={size}
      height={size}
      backgroundColor={color}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      flexShrink={0}
    />
  );

  const mappingRows: ColorMappingRow[] = pngColors.map(({ color, count }) => ({
    pngColor: color,
    selectedColor: colorMappings.get(color) || availableColors[0]?.Color || '#000000',
    count,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxHeight="90vh">
        <ModalHeader>Import PNG Image</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Image Info */}
            <Box>
              <Text fontWeight="semibold" mb={2}>Image Information</Text>
              <HStack spacing={4}>
                <Badge colorScheme="blue">{imageWidth} × {imageHeight} pixels</Badge>
                <Badge colorScheme="green">{pngColors.length} unique colors</Badge>
              </HStack>
            </Box>

            <Divider />

            {/* Insertion Position */}
            <Box>
              <Text fontWeight="semibold" mb={3}>Insertion Position</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="sm">X Coordinate</FormLabel>
                    <NumberInput 
                      value={insertX} 
                      onChange={(_, value) => setInsertX(value || 0)}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="sm">Y Coordinate</FormLabel>
                    <NumberInput 
                      value={insertY} 
                      onChange={(_, value) => setInsertY(value || 0)}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
              </Grid>
              <Text fontSize="xs" color="gray.500" mt={2}>
                The image will be inserted starting at these coordinates (top-left corner)
              </Text>
            </Box>

            <Divider />

            {/* Color Mappings */}
            <Box>
              <Text fontWeight="semibold" mb={3}>Color Mapping</Text>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Map each color from your PNG to an available color in the current palette:
              </Text>
              
              <VStack spacing={3} align="stretch">
                {mappingRows.map(({ pngColor, selectedColor, count }, index) => (
                  <HStack key={index} spacing={4} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <VStack spacing={1} align="center" minWidth="80px">
                      <ColorSwatch color={pngColor} />
                      <Text fontSize="xs" color="gray.600">PNG</Text>
                    </VStack>
                    
                    <Text fontSize="lg" color="gray.400">→</Text>
                    
                    <VStack spacing={1} align="center" minWidth="80px">
                      <ColorSwatch color={selectedColor} />
                      <Text fontSize="xs" color="gray.600">Design</Text>
                    </VStack>
                    
                    <Box flex="1">
                      <Select
                        value={selectedColor}
                        onChange={(e) => handleColorChange(pngColor, e.target.value)}
                        size="sm"
                      >
                        {availableColors.map((color) => (
                          <option key={color.Color} value={color.Color}>
                            {color.color_name} ({color.Color})
                          </option>
                        ))}
                      </Select>
                    </Box>
                    
                    <Badge colorScheme="blue" fontSize="xs">
                      {count} px
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleConfirm}
            isDisabled={colorMappings.size === 0}
          >
            Import Image
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ColorMappingDialog;