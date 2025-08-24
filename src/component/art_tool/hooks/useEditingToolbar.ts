import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Design, Pixel } from '../../../types/art-tool';
import { ViewportPixel } from '../../viewport/types';
import UndoManager from '../../viewport/utils/undo-manager';

export interface EditingToolbarState {
  selectedColor: string | null;
  selectedTool: 'paint' | 'erase' | 'select' | 'eyedropper';
  designName: string;
  isEditingName: boolean;
  copyBuffer: {
    pixels: ViewportPixel[];
    selectionTopLeft: { x: number; y: number };
  } | null;
  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  showKeyboardShortcuts: boolean;
}

export interface EditingToolbarActions {
  setSelectedColor: (color: string | null) => void;
  setSelectedTool: (tool: EditingToolbarState['selectedTool']) => void;
  setDesignName: (name: string) => void;
  setIsEditingName: (editing: boolean) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleCopy: (selection: { x: number; y: number; width: number; height: number } | null, pixels: ViewportPixel[]) => void;
  handlePaste: (x: number, y: number) => void;
  handleFill: (selection: { x: number; y: number; width: number; height: number } | null, color: string) => void;
  handleEraseSelection: (selection: { x: number; y: number; width: number; height: number } | null) => void;
  toggleKeyboardShortcuts: () => void;
  addUndoState: (editedPixels: Pixel[]) => void;
}

export interface UseEditingToolbarProps {
  design: Design | null;
  editedPixels: Pixel[];
  setEditedPixels: React.Dispatch<React.SetStateAction<Pixel[]>>;
  onSubmitEdit: (designName: string) => Promise<void>;
  onCancelEdit: () => void;
  isEditing: boolean;
}

export function useEditingToolbar({
  design,
  editedPixels,
  setEditedPixels,
  onSubmitEdit,
  onCancelEdit,
  isEditing,
}: UseEditingToolbarProps): [EditingToolbarState, EditingToolbarActions] {
  const toast = useToast();
  const undoManager = useRef(new UndoManager(100)).current;
  
  const [selectedColor, setSelectedColorState] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<EditingToolbarState['selectedTool']>('paint');
  const [designName, setDesignName] = useState(design?.design_name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [copyBuffer, setCopyBuffer] = useState<EditingToolbarState['copyBuffer']>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Update design name when design changes
  useEffect(() => {
    if (design) {
      setDesignName(design.design_name || '');
    }
  }, [design]);

  // Update undo/redo state when edited pixels change
  useEffect(() => {
    setCanUndo(undoManager.hasHistory());
    setCanRedo(undoManager.hasRedoHistory());
  }, [editedPixels, undoManager]);

  // Reset toolbar state when editing state changes
  useEffect(() => {
    if (!isEditing) {
      setSelectedColorState(null);
      setSelectedTool('paint');
      setIsEditingName(false);
      setCopyBuffer(null);
      setShowKeyboardShortcuts(false);
      undoManager.clearHistory();
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [isEditing, undoManager]);

  const setSelectedColor = useCallback((color: string | null) => {
    setSelectedColorState(color);
    // Auto-select paint tool when color is selected
    if (color && selectedTool === 'eyedropper') {
      setSelectedTool('paint');
    }
  }, [selectedTool]);

  const handleSave = useCallback(async () => {
    if (!designName.trim()) {
      toast({
        title: 'Design Name Required',
        description: 'Please enter a name for your design before saving.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      setIsEditingName(true);
      return;
    }

    try {
      await onSubmitEdit(designName.trim());
      setIsEditingName(false);
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: `Failed to save design: ${(error as Error).message || error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [designName, onSubmitEdit, toast]);

  const handleCancel = useCallback(() => {
    if (editedPixels.length > 0) {
      // Show confirmation dialog logic would go here
      // For now, just cancel immediately
    }
    onCancelEdit();
    setIsEditingName(false);
  }, [editedPixels, onCancelEdit]);

  const addUndoState = useCallback((currentEditedPixels: Pixel[]) => {
    undoManager.addState({ editedPixels: [...currentEditedPixels] });
    setCanUndo(true);
    setCanRedo(false);
  }, [undoManager]);

  const handleUndo = useCallback(() => {
    if (!undoManager.hasHistory()) return;
    
    const previousState = undoManager.undo();
    if (previousState) {
      setEditedPixels(previousState.editedPixels);
      setCanUndo(undoManager.hasHistory());
      setCanRedo(true);
    }
  }, [undoManager, setEditedPixels]);

  const handleRedo = useCallback(() => {
    if (!undoManager.hasRedoHistory()) return;
    
    const nextState = undoManager.redo();
    if (nextState) {
      setEditedPixels(nextState.editedPixels);
      setCanRedo(undoManager.hasRedoHistory());
      setCanUndo(true);
    }
  }, [undoManager, setEditedPixels]);

  const handleCopy = useCallback((
    selection: { x: number; y: number; width: number; height: number } | null,
    pixels: ViewportPixel[]
  ) => {
    if (!selection || !design) return;

    const { x, y, width, height } = selection;
    const selectedPixels = pixels.filter(
      (pixel) =>
        pixel.designId === design.id &&
        pixel.x >= x &&
        pixel.x < x + width &&
        pixel.y >= y &&
        pixel.y < y + height
    );

    const uniquePixels = new Map<string, ViewportPixel>();
    selectedPixels.forEach((pixel) =>
      uniquePixels.set(`${pixel.x}-${pixel.y}`, pixel)
    );

    setCopyBuffer({
      pixels: Array.from(uniquePixels.values()),
      selectionTopLeft: { x, y },
    });

    toast({
      title: 'Copied',
      description: `Copied ${uniquePixels.size} pixels to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [design, toast]);

  const handlePaste = useCallback((pasteX: number, pasteY: number) => {
    if (!copyBuffer || !design || copyBuffer.pixels.length === 0) return;

    const { x: selectionX, y: selectionY } = copyBuffer.selectionTopLeft;
    const offsetX = pasteX - selectionX;
    const offsetY = pasteY - selectionY;

    const pastedPixels = copyBuffer.pixels.map((pixel) => ({
      x: pixel.x + offsetX,
      y: pixel.y + offsetY,
      color: pixel.color,
      designId: design.id,
    }));

    addUndoState(editedPixels);
    setEditedPixels((prev) => [...prev, ...pastedPixels]);

    toast({
      title: 'Pasted',
      description: `Pasted ${pastedPixels.length} pixels`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [copyBuffer, design, editedPixels, addUndoState, setEditedPixels, toast]);

  const handleFill = useCallback((
    selection: { x: number; y: number; width: number; height: number } | null,
    color: string
  ) => {
    if (!selection || !design) return;

    const { x, y, width, height } = selection;
    const filledPixels: Pixel[] = [];

    // Generate pixels for the entire selection rectangle
    for (let pixelX = x; pixelX < x + width; pixelX++) {
      for (let pixelY = y; pixelY < y + height; pixelY++) {
        filledPixels.push({
          x: pixelX,
          y: pixelY,
          color: color,
          designId: design.id,
        });
      }
    }

    addUndoState(editedPixels);
    
    // Remove any existing pixels in the selection area, then add the filled pixels
    setEditedPixels((prev) => {
      // Filter out pixels that would be overwritten by the fill
      const filteredPixels = prev.filter(
        (pixel) =>
          !(pixel.x >= x &&
            pixel.x < x + width &&
            pixel.y >= y &&
            pixel.y < y + height &&
            pixel.designId === design.id)
      );
      return [...filteredPixels, ...filledPixels];
    });

    toast({
      title: 'Filled',
      description: `Filled selection with ${filledPixels.length} pixels`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [design, editedPixels, addUndoState, setEditedPixels, toast]);

  const handleEraseSelection = useCallback((
    selection: { x: number; y: number; width: number; height: number } | null
  ) => {
    if (!selection || !design) return;

    const { x, y, width, height } = selection;
    
    // Count pixels that will be erased for feedback
    let erasedCount = 0;

    addUndoState(editedPixels);
    
    // Remove all pixels in the selection area
    setEditedPixels((prev) => {
      const filteredPixels = prev.filter((pixel) => {
        const shouldErase = pixel.x >= x &&
          pixel.x < x + width &&
          pixel.y >= y &&
          pixel.y < y + height &&
          pixel.designId === design.id;
        
        if (shouldErase) {
          erasedCount++;
        }
        
        return !shouldErase;
      });
      
      return filteredPixels;
    });

    toast({
      title: 'Erased',
      description: `Erased ${erasedCount} pixels from selection`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [design, editedPixels, addUndoState, setEditedPixels, toast]);

  const toggleKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts(prev => !prev);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when editing name
      if (isEditingName) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsEditingName(true);
      } else if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        toggleKeyboardShortcuts();
      }

      // Tool shortcuts
      if (!isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'b':
            setSelectedTool('paint');
            break;
          case 'e':
            setSelectedTool('erase');
            break;
          case 's':
            setSelectedTool('select');
            break;
          case 'i':
            setSelectedTool('eyedropper');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditing,
    isEditingName,
    handleUndo,
    handleRedo,
    handleSave,
    handleCancel,
    toggleKeyboardShortcuts,
    setSelectedTool,
  ]);

  const state: EditingToolbarState = {
    selectedColor,
    selectedTool,
    designName,
    isEditingName,
    copyBuffer,
    canUndo,
    canRedo,
    hasUnsavedChanges: editedPixels.length > 0,
    showKeyboardShortcuts,
  };

  const actions: EditingToolbarActions = {
    setSelectedColor,
    setSelectedTool,
    setDesignName,
    setIsEditingName,
    handleSave,
    handleCancel,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleFill,
    handleEraseSelection,
    toggleKeyboardShortcuts,
    addUndoState,
  };

  return [state, actions];
}