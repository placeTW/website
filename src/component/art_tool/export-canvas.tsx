// src/component/art_tool/export-canvas.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Text, useToast } from '@chakra-ui/react';
import {
  databaseFetchCanvas,
  databaseFetchDesigns,
} from '../../api/supabase/database';
import { Canvas, Design } from '../../types/art-tool';
import { supabase } from '../../api/supabase';
import { exportCanvasAsPNG } from '../../utils/png-export';


const ExportCanvas: React.FC = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch the main canvas (replace with your actual canvas ID)
      const canvasId = 1; // Assuming '1' is the ID of the main canvas
      const canvas: Canvas | null = await databaseFetchCanvas(canvasId);

      if (!canvas) {
        toast({
          title: t('Error'),
          description: t('Main canvas not found.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      // Fetch all designs on the canvas
      const designs: Design[] | null = await databaseFetchDesigns(canvasId);

      if (!designs || designs.length === 0) {
        toast({
          title: t('Error'),
          description: t('No designs found on the main canvas.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      // Use the helper function to create the PNG
      const blob = await exportCanvasAsPNG(designs, canvas.layer_order, canvas.canvas_name);

      // Upload the Blob to Supabase storage
      const filename = `${new Date().toISOString()}-canvas_export_${canvas.canvas_name}.png`;
      const { error } = await supabase.storage
        .from('canvas-exports')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      toast({
        title: t('Success'),
        description: t('Canvas exported successfully. File saved as {{filename}}', { filename }),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting canvas:', error);
      toast({
        title: t('Error'),
        description: t('An error occurred while exporting the canvas.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <Box mt={4}>
      <Text fontSize="xl" fontWeight="bold" mb={2}>
        {t('Export Canvas')}
      </Text>
      <Button colorScheme="blue" onClick={handleExport} isLoading={isExporting}>
        {t('Export Main Canvas')}
      </Button>
    </Box>
  );
};

export default ExportCanvas;
