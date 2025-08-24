import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  useBreakpointValue,
  useColorModeValue,
  useToast,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import Konva from 'konva';
import { Design } from '../../../types/art-tool';
import { ViewportPixel } from '../../viewport/types';
import { GRID_SIZE } from '../../viewport/constants';
import { useEditingToolbar, UseEditingToolbarProps } from '../hooks/useEditingToolbar';
import { DesignInfoSection } from './sections/DesignInfoSection';
import { ToolSelectionSection } from './sections/ToolSelectionSection';
import { ColorPaletteSection } from './sections/ColorPaletteSection';
import { ActionButtonsSection } from './sections/ActionButtonsSection';
import { KeyboardShortcutsPanel } from './sections/KeyboardShortcutsPanel';
import { PngImportSection } from './sections/PngImportSection';

const MotionBox = motion(Box);

export interface FloatingToolbarProps extends Omit<UseEditingToolbarProps, 'design'> {
  design: Design | null;
  colors: { Color: string; color_sort: number | null; color_name: string }[];
  isVisible: boolean;
  onColorSelect?: (color: string) => void;
  onToolChange?: (tool: 'paint' | 'erase' | 'select' | 'eyedropper') => void;
  selection?: { x: number; y: number; width: number; height: number } | null;
  pixels?: ViewportPixel[];
  stageRef?: React.RefObject<Konva.Stage>;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  design,
  editedPixels,
  setEditedPixels,
  onSubmitEdit,
  onCancelEdit,
  isEditing,
  colors,
  isVisible,
  onColorSelect,
  onToolChange,
  selection,
  pixels = [],
  stageRef,
}) => {
  const toast = useToast();
  
  const [toolbarState, toolbarActions] = useEditingToolbar({
    design,
    editedPixels,
    setEditedPixels,
    onSubmitEdit,
    onCancelEdit,
    isEditing,
  });

  // More granular responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const isSmallDesktop = useBreakpointValue({ base: false, md: true, xl: false }) ?? false;
  const shouldWrap = useBreakpointValue({ base: true, md: true, xl: false }) ?? false;
  const toolbarSpacing = useBreakpointValue({ base: 2, md: 3, xl: 4 }) ?? 3;
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  // Enhanced color select handler - automatically switch to paint tool
  const handleColorSelect = React.useCallback((color: string) => {
    toolbarActions.setSelectedColor(color);
    if (toolbarState.selectedTool === 'erase') {
      toolbarActions.setSelectedTool('paint');
    }
    onColorSelect?.(color);
    onToolChange?.('paint');
  }, [toolbarActions, onColorSelect, onToolChange, toolbarState.selectedTool]);

  // Enhanced tool change handler
  const handleToolChange = React.useCallback((tool: 'paint' | 'erase' | 'select' | 'eyedropper') => {
    toolbarActions.setSelectedTool(tool);
    onToolChange?.(tool);
  }, [toolbarActions, onToolChange]);

  // Handle paste with stage position
  const handleEnhancedPaste = React.useCallback((x?: number, y?: number) => {
    if (x !== undefined && y !== undefined) {
      toolbarActions.handlePaste(x, y);
      return;
    }

    // Use stage pointer position if coordinates not provided
    if (stageRef?.current) {
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();
      let pasteX = 0, pasteY = 0;
      
      if (pointer) {
        const scale = stage.scaleX();
        // Calculate viewport coordinates (same as painting system)
        pasteX = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
        pasteY = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
      } else {
        // Fallback to center of viewport if no pointer position
        const scale = stage.scaleX();
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        pasteX = Math.floor((centerX - stage.x()) / (GRID_SIZE * scale));
        pasteY = Math.floor((centerY - stage.y()) / (GRID_SIZE * scale));
      }
      
      toolbarActions.handlePaste(pasteX, pasteY);
    }
  }, [toolbarActions, stageRef]);

  // Handle fill selection with selected color
  const handleFill = React.useCallback(() => {
    if (!selection || !toolbarState.selectedColor) return;
    toolbarActions.handleFill(selection, toolbarState.selectedColor);
  }, [toolbarActions, selection, toolbarState.selectedColor]);

  // Handle fill with specific color (for double-click)
  const handleFillWithColor = React.useCallback((color: string) => {
    if (!selection) return;
    toolbarActions.handleFill(selection, color);
  }, [toolbarActions, selection]);

  // Handle erase selection
  const handleEraseSelection = React.useCallback(() => {
    if (!selection) return;
    toolbarActions.handleEraseSelection(selection);
  }, [toolbarActions, selection]);

  // Handle PNG import
  const handlePixelsImported = React.useCallback((
    pixels: { x: number; y: number; color: string; designId: number }[]
  ) => {
    // Add undo state before importing
    toolbarActions.addUndoState(editedPixels);
    
    // Convert to the correct pixel format and add to edited pixels
    const newPixels = pixels.map(pixel => ({
      x: pixel.x,
      y: pixel.y,
      color: pixel.color,
      designId: pixel.designId,
    }));
    
    setEditedPixels(prev => [...prev, ...newPixels]);
  }, [toolbarActions, editedPixels, setEditedPixels]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!isEditing || !isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (e.key.toLowerCase() === 'f' && !isCtrlOrCmd) {
        e.preventDefault();
        handleFill();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isCtrlOrCmd) {
        e.preventDefault();
        handleEraseSelection();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selection) {
          toolbarActions.handleCopy(selection, pixels);
        } else {
          toast({
            title: 'Copy Failed',
            description: 'Select an area first using the Select tool (S) or Ctrl+drag to copy pixels.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (toolbarState.copyBuffer && toolbarState.copyBuffer.pixels.length > 0) {
          handleEnhancedPaste();
        } else {
          toast({
            title: 'Paste Failed',
            description: 'Nothing to paste. Copy an area first using Ctrl+C.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isVisible, handleFill, handleEraseSelection, toolbarActions, handleEnhancedPaste, selection, pixels, toolbarState.copyBuffer, toast]);

  if (!isEditing || !isVisible) {
    return null;
  }

  // New layout: full-width toolbar at bottom of viewport
  return (
    <AnimatePresence>
      <MotionBox
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <VStack
          bg={bgColor}
          borderTopWidth="1px"
          borderColor={borderColor}
          boxShadow={`0 -4px 20px ${shadowColor}`}
          p={3}
          spacing={3}
          width="100%"
        >
          {/* Main toolbar row */}
          <HStack
            width="100%"
            justify={isMobile ? 'center' : shouldWrap ? 'center' : 'space-between'}
            align="center"
            spacing={toolbarSpacing}
            wrap={shouldWrap ? 'wrap' : 'nowrap'}
            gap={shouldWrap ? 2 : undefined}
          >
            {/* Design Info Section */}
            <Box flex={isMobile || shouldWrap ? 'none' : '0 0 auto'}>
              <DesignInfoSection
                designName={toolbarState.designName}
                isEditingName={toolbarState.isEditingName}
                hasUnsavedChanges={toolbarState.hasUnsavedChanges}
                onNameChange={toolbarActions.setDesignName}
                onStartEditingName={() => toolbarActions.setIsEditingName(true)}
                onStopEditingName={() => toolbarActions.setIsEditingName(false)}
                onSave={toolbarActions.handleSave}
                onCancel={toolbarActions.handleCancel}
                isVertical={false}
              />
            </Box>

            {/* Tool Selection Section */}
            <Box flex={isMobile || shouldWrap ? 'none' : '0 0 auto'}>
              <ToolSelectionSection
                selectedTool={toolbarState.selectedTool}
                onToolChange={handleToolChange}
                isVertical={false}
              />
            </Box>

            {/* Action Buttons Section */}
            <Box flex={isMobile || shouldWrap ? 'none' : '0 0 auto'}>
              <ActionButtonsSection
                canUndo={toolbarState.canUndo}
                canRedo={toolbarState.canRedo}
                canCopy={!!selection}
                canPaste={!!toolbarState.copyBuffer}
                canFill={!!selection && !!toolbarState.selectedColor}
                canEraseSelection={!!selection}
                onUndo={toolbarActions.handleUndo}
                onRedo={toolbarActions.handleRedo}
                onCopy={() => selection && toolbarActions.handleCopy(selection, pixels)}
                onPaste={() => handleEnhancedPaste()}
                onFill={handleFill}
                onEraseSelection={handleEraseSelection}
                onToggleShortcuts={toolbarActions.toggleKeyboardShortcuts}
                showShortcuts={toolbarState.showKeyboardShortcuts}
                isVertical={false}
              />
            </Box>

            {/* PNG Import Section - hide on small desktop to save space */}
            {design && !isSmallDesktop && (
              <Box flex={isMobile || shouldWrap ? 'none' : '0 0 auto'}>
                <PngImportSection
                  availableColors={colors}
                  onPixelsImported={handlePixelsImported}
                  designId={design.id}
                  isVertical={false}
                />
              </Box>
            )}
          </HStack>

          {/* PNG Import Section for small desktop - show as separate row */}
          {design && isSmallDesktop && (
            <Flex justify="center" width="100%">
              <PngImportSection
                availableColors={colors}
                onPixelsImported={handlePixelsImported}
                designId={design.id}
                isVertical={false}
              />
            </Flex>
          )}

          {/* Color palette row (always separate) */}
          <Box width="100%">
            <Divider mb={2} />
            <Flex justify="center">
              <ColorPaletteSection
                colors={colors}
                selectedColor={toolbarState.selectedColor}
                onColorSelect={handleColorSelect}
                onColorDoubleClick={(color) => {
                  toolbarActions.setSelectedColor(color);
                  handleFillWithColor(color);
                }}
                isVertical={false}
              />
            </Flex>
          </Box>

          {/* Keyboard Shortcuts Modal */}
          <Modal
            isOpen={toolbarState.showKeyboardShortcuts}
            onClose={() => toolbarActions.toggleKeyboardShortcuts()}
            size="4xl"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Keyboard Shortcuts</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <KeyboardShortcutsPanel />
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </MotionBox>
    </AnimatePresence>
  );
};

export default FloatingToolbar;