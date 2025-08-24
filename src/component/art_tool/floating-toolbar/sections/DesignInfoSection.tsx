import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaFloppyDisk as FaSave,
  FaPen as FaEdit,
  FaXmark as FaCancel,
  FaCheck,
} from 'react-icons/fa6';

export interface DesignInfoSectionProps {
  designName: string;
  isEditingName: boolean;
  hasUnsavedChanges: boolean;
  onNameChange: (name: string) => void;
  onStartEditingName: () => void;
  onStopEditingName: () => void;
  onSave: () => void;
  onCancel: () => void;
  isVertical?: boolean;
}

export const DesignInfoSection: React.FC<DesignInfoSectionProps> = ({
  designName,
  isEditingName,
  hasUnsavedChanges,
  onNameChange,
  onStartEditingName,
  onStopEditingName,
  onSave,
  onCancel,
  isVertical = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempName, setTempName] = useState(designName);
  
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const editingBgColor = useColorModeValue('blue.50', 'blue.900');

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Update temp name when design name changes
  useEffect(() => {
    setTempName(designName);
  }, [designName]);

  const handleStartEdit = () => {
    setTempName(designName);
    onStartEditingName();
  };

  const handleConfirmEdit = () => {
    onNameChange(tempName.trim() || 'Untitled Design');
    onStopEditingName();
  };

  const handleCancelEdit = () => {
    setTempName(designName);
    onStopEditingName();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const Container = isVertical ? VStack : Flex;
  const containerProps = isVertical 
    ? { spacing: 2, align: 'stretch' }
    : { align: 'center', gap: 2 };

  return (
    <Container {...containerProps}>
      {/* Design Name Section */}
      <Box
        minWidth={isVertical ? 'auto' : '200px'}
        maxWidth={isVertical ? 'auto' : '400px'}
        bg={isEditingName ? editingBgColor : 'transparent'}
        borderRadius="md"
        p={isEditingName ? 2 : 0}
        transition="all 0.2s"
      >
        {isEditingName ? (
          <Flex align="center" gap={1}>
            <Input
              ref={inputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleKeyDown}
              size="sm"
              variant="filled"
              placeholder="Enter design name..."
              bg="white"
              _dark={{ bg: 'gray.700' }}
              flex={1}
            />
            <Tooltip label="Confirm (Enter)">
              <IconButton
                icon={<FaCheck />}
                size="sm"
                colorScheme="green"
                onClick={handleConfirmEdit}
                aria-label="Confirm name change"
              />
            </Tooltip>
            <Tooltip label="Cancel (Esc)">
              <IconButton
                icon={<FaCancel />}
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                aria-label="Cancel name change"
              />
            </Tooltip>
          </Flex>
        ) : (
          <Flex align="center" gap={2} cursor="pointer" onClick={handleStartEdit}>
            <Box flex={1} minWidth="0">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                noOfLines={1}
                title={designName}
              >
                {designName || 'Untitled Design'}
              </Text>
              {hasUnsavedChanges && (
                <Text fontSize="xs" color={mutedTextColor}>
                  Unsaved changes
                </Text>
              )}
            </Box>
            <Tooltip label="Edit name (F2)">
              <IconButton
                icon={<FaEdit />}
                size="xs"
                variant="ghost"
                aria-label="Edit design name"
              />
            </Tooltip>
          </Flex>
        )}
      </Box>

      {/* Save/Cancel Actions */}
      {!isEditingName && (
        <Flex gap={1} direction={isVertical ? 'column' : 'row'}>
          <Tooltip label="Save design (Ctrl+S)">
            <Button
              leftIcon={<FaSave />}
              size="sm"
              colorScheme="green"
              onClick={onSave}
              isDisabled={!designName.trim()}
              variant={hasUnsavedChanges ? 'solid' : 'outline'}
              minWidth={isVertical ? 'auto' : '80px'}
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip label="Cancel editing (Esc)">
            <Button
              leftIcon={<FaCancel />}
              size="sm"
              variant="outline"
              onClick={onCancel}
              minWidth={isVertical ? 'auto' : '80px'}
            >
              Cancel
            </Button>
          </Tooltip>
        </Flex>
      )}
    </Container>
  );
};

export default DesignInfoSection;