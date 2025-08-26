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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const actions: ActionButton[] = [
    {
      icon: FaUndo,
      label: t('Undo'),
      shortcut: 'Ctrl+Z',
      onClick: onUndo,
      isDisabled: !canUndo,
      description: t('Undo last action'),
    },
    {
      icon: FaRedo,
      label: t('Redo'),
      shortcut: 'Ctrl+Y',
      onClick: onRedo,
      isDisabled: !canRedo,
      description: t('Redo last undone action'),
    },
    {
      icon: FaCopy,
      label: t('Copy'),
      shortcut: 'Ctrl+C',
      onClick: onCopy,
      isDisabled: !canCopy,
      colorScheme: 'blue',
      description: t('Copy selected area'),
    },
    {
      icon: FaPaste,
      label: t('Paste'),
      shortcut: 'Ctrl+V',
      onClick: onPaste,
      isDisabled: !canPaste,
      colorScheme: 'green',
      description: t('Paste copied pixels'),
    },
    {
      icon: FaFill,
      label: t('Fill'),
      shortcut: 'F',
      onClick: onFill,
      isDisabled: !canFill,
      colorScheme: 'orange',
      description: t('Fill selected area with color'),
    },
    {
      icon: FaEraseSelection,
      label: t('Erase Selection'),
      shortcut: 'Delete',
      onClick: onEraseSelection,
      isDisabled: !canEraseSelection,
      colorScheme: 'red',
      description: t('Erase all pixels in selected area'),
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
          <Box fontWeight="semibold">{t("Keyboard Shortcuts")}</Box>
          <Box fontSize="xs" opacity={0.8}>
            {showShortcuts ? t('Hide shortcuts panel') : t('Show all keyboard shortcuts')}
          </Box>
          <Badge size="sm" variant="subtle" mt={1}>
            {t("? or F1")}
          </Badge>
        </Box>
      }
      placement={isVertical ? 'right' : 'top'}
    >
      <IconButton
        icon={<FaKeyboard />}
        aria-label={t("Toggle keyboard shortcuts")}
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