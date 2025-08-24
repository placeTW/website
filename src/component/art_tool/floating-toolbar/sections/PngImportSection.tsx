import React, { useState, useRef, useCallback } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaFileImage } from 'react-icons/fa6';
import { extractPngData, extractColors, convertToPixels, ExtractedColor } from '../../../../utils/pngUtils';
import { ColorMappingDialog } from '../dialogs/ColorMappingDialog';

export interface PngImportSectionProps {
  availableColors: { Color: string; color_name: string; color_sort: number | null }[];
  onPixelsImported: (pixels: { x: number; y: number; color: string; designId: number }[]) => void;
  designId: number;
  isVertical?: boolean;
}

export const PngImportSection: React.FC<PngImportSectionProps> = ({
  availableColors,
  onPixelsImported,
  designId,
  isVertical = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pngData, setPngData] = useState<{
    imageData: ImageData;
    width: number;
    height: number;
    extractedColors: ExtractedColor[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/png')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PNG image file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { imageData, width, height } = await extractPngData(file);
      const extractedColors = extractColors(imageData);

      if (extractedColors.length === 0) {
        toast({
          title: 'No Colors Found',
          description: 'The image appears to be empty or contains no visible pixels.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (extractedColors.length > 50) {
        toast({
          title: 'Too Many Colors',
          description: `The image contains ${extractedColors.length} colors. Consider using an image with fewer colors for better results.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }

      setPngData({
        imageData,
        width,
        height,
        extractedColors,
      });
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Import Error',
        description: `Failed to process PNG file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  const handleColorMappingConfirm = useCallback((
    colorMapping: Map<string, string>,
    insertPosition: { x: number; y: number }
  ) => {
    if (!pngData) return;

    try {
      const pngPixels = convertToPixels(pngData.imageData, colorMapping);
      const designPixels = pngPixels.map(pixel => ({
        ...pixel,
        x: pixel.x + insertPosition.x,
        y: pixel.y + insertPosition.y,
        designId,
      }));

      onPixelsImported(designPixels);
      
      toast({
        title: 'PNG Imported Successfully',
        description: `Imported ${designPixels.length} pixels from PNG image.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsDialogOpen(false);
      setPngData(null);
    } catch (error) {
      toast({
        title: 'Import Error',
        description: `Failed to import PNG: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [pngData, designId, onPixelsImported, toast]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setPngData(null);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Box 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        p={1}
      >
        <Tooltip
          label={
            <Box textAlign="center">
              <Box fontWeight="semibold">Import PNG Image</Box>
              <Box fontSize="xs" opacity={0.8}>
                Import pixels from a PNG file with color mapping
              </Box>
            </Box>
          }
          placement={isVertical ? 'right' : 'top'}
        >
          <IconButton
            icon={<FaFileImage />}
            aria-label="Import PNG Image"
            size="sm"
            colorScheme="purple"
            variant="outline"
            onClick={handleImportClick}
            _hover={{
              transform: 'scale(1.05)',
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
            transition="all 0.1s"
          />
        </Tooltip>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Color mapping dialog */}
      {pngData && (
        <ColorMappingDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          pngColors={pngData.extractedColors}
          availableColors={availableColors}
          onConfirm={handleColorMappingConfirm}
          imageWidth={pngData.width}
          imageHeight={pngData.height}
        />
      )}
    </>
  );
};

export default PngImportSection;