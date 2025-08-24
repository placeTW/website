import React from 'react';
import {
  ButtonGroup,
  IconButton,
  Tooltip,
  VStack,
  Badge,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaArrowRotateLeft as FaUndo,
  FaArrowRotateRight as FaRedo,
  FaCopy,
  FaClipboard as FaPaste,
  FaFillDrip as FaFill,
  FaTrash as FaEraseSelection,
  FaKeyboard,
} from 'react-icons/fa6';

export interface ActionButtonsSectionProps {
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canFill: boolean;
  canEraseSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onFill: () => void;
  onEraseSelection: () => void;
  onToggleShortcuts: () => void;
  showShortcuts: boolean;
  isVertical?: boolean;
}

interface ActionButton {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  onClick: () => void;
  isDisabled: boolean;
  colorScheme?: string;
  description: string;
}

export const ActionButtonsSection: React.FC<ActionButtonsSectionProps> = ({
  canUndo,
  canRedo,
  canCopy,
  canPaste,
  canFill,
  canEraseSelection,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onFill,
  onEraseSelection,
  onToggleShortcuts,
  showShortcuts,
  isVertical = false,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const actions: ActionButton[] = [
    {
      icon: FaUndo,
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      onClick: onUndo,
      isDisabled: !canUndo,
      description: 'Undo last action',
    },
    {
      icon: FaRedo,
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      onClick: onRedo,
      isDisabled: !canRedo,
      description: 'Redo last undone action',
    },
    {
      icon: FaCopy,
      label: 'Copy',
      shortcut: 'Ctrl+C',
      onClick: onCopy,
      isDisabled: !canCopy,
      colorScheme: 'blue',
      description: 'Copy selected area',
    },
    {
      icon: FaPaste,
      label: 'Paste',
      shortcut: 'Ctrl+V',
      onClick: onPaste,
      isDisabled: !canPaste,
      colorScheme: 'green',
      description: 'Paste copied pixels',
    },
    {
      icon: FaFill,
      label: 'Fill',
      shortcut: 'F',
      onClick: onFill,
      isDisabled: !canFill,
      colorScheme: 'orange',
      description: 'Fill selected area with color',
    },
    {
      icon: FaEraseSelection,
      label: 'Erase Selection',
      shortcut: 'Delete',
      onClick: onEraseSelection,
      isDisabled: !canEraseSelection,
      colorScheme: 'red',
      description: 'Erase all pixels in selected area',
    },
  ];

  const ActionButton: React.FC<{ action: ActionButton }> = ({ action }) => {
    const IconComponent = action.icon;

    return (
      <Tooltip
        label={
          <Box textAlign="center">
            <Box fontWeight="semibold">{action.label}</Box>
            <Box fontSize="xs" opacity={0.8}>
              {action.description}
            </Box>
            <Badge size="sm" variant="subtle" mt={1}>
              {action.shortcut}
            </Badge>
          </Box>
        }
        placement={isVertical ? 'right' : 'top'}
      >
        <IconButton
          icon={<IconComponent />}
          aria-label={action.label}
          size="sm"
          colorScheme={action.colorScheme || 'gray'}
          variant={action.isDisabled ? 'ghost' : 'outline'}
          onClick={action.onClick}
          isDisabled={action.isDisabled}
          _disabled={{
            opacity: 0.4,
            cursor: 'not-allowed',
          }}
          _hover={action.isDisabled ? {} : {
            transform: 'scale(1.05)',
          }}
          _active={action.isDisabled ? {} : {
            transform: 'scale(0.95)',
          }}
          transition="all 0.1s"
        />
      </Tooltip>
    );
  };

  const ShortcutsToggleButton = () => (
    <Tooltip
      label={
        <Box textAlign="center">
          <Box fontWeight="semibold">Keyboard Shortcuts</Box>
          <Box fontSize="xs" opacity={0.8}>
            {showShortcuts ? 'Hide shortcuts panel' : 'Show all keyboard shortcuts'}
          </Box>
          <Badge size="sm" variant="subtle" mt={1}>
            ? or F1
          </Badge>
        </Box>
      }
      placement={isVertical ? 'right' : 'top'}
    >
      <IconButton
        icon={<FaKeyboard />}
        aria-label="Toggle keyboard shortcuts"
        size="sm"
        colorScheme={showShortcuts ? 'purple' : 'gray'}
        variant={showShortcuts ? 'solid' : 'ghost'}
        onClick={onToggleShortcuts}
        _hover={{
          transform: 'scale(1.05)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.1s"
      />
    </Tooltip>
  );

  if (isVertical) {
    return (
      <VStack spacing={1} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={1}>
        {actions.map((action, index) => (
          <ActionButton key={index} action={action} />
        ))}
        <Box borderTop="1px solid" borderColor={borderColor} pt={1} mt={1} w="100%">
          <ShortcutsToggleButton />
        </Box>
      </VStack>
    );
  }

  return (
    <ButtonGroup
      size="sm"
      variant="outline"
      spacing={1}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={1}
    >
      {actions.map((action, index) => (
        <ActionButton key={index} action={action} />
      ))}
      
      {/* Separator */}
      <Box borderLeft="1px solid" borderColor={borderColor} height="24px" mx={1} />
      
      <ShortcutsToggleButton />
    </ButtonGroup>
  );
};

export default ActionButtonsSection;