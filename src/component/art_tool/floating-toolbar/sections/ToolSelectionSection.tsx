import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ButtonGroup,
  IconButton,
  Tooltip,
  VStack,
  useColorModeValue,
  Badge,
  Box,
} from '@chakra-ui/react';
import {
  FaPaintbrush as FaPaint,
  FaEraser,
  FaHandPointer as FaSelect,
  FaEyeDropper,
  FaFill as FaBucket,
} from 'react-icons/fa6';

export type ToolType = 'paint' | 'erase' | 'select' | 'eyedropper' | 'bucket';

export interface Tool {
  type: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut: string;
  description: string;
  colorScheme?: string;
}


export interface ToolSelectionSectionProps {
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isVertical?: boolean;
}

export const ToolSelectionSection: React.FC<ToolSelectionSectionProps> = ({
  selectedTool,
  onToolChange,
  isVertical = false,
}) => {
  const { t } = useTranslation();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const TOOLS: Tool[] = [
    {
      type: 'paint',
      icon: FaPaint,
      label: t('Paint'),
      shortcut: 'B',
      description: t('Paint pixels with selected color'),
      colorScheme: 'blue',
    },
    {
      type: 'erase',
      icon: FaEraser,
      label: t('Erase'),
      shortcut: 'E',
      description: t('Erase pixels (make transparent)'),
      colorScheme: 'red',
    },
    {
      type: 'select',
      icon: FaSelect,
      label: t('Select'),
      shortcut: 'S',
      description: t('Select rectangular area'),
      colorScheme: 'purple',
    },
    {
      type: 'eyedropper',
      icon: FaEyeDropper,
      label: t('Eyedropper'),
      shortcut: 'I',
      description: t('Pick color from existing pixels'),
      colorScheme: 'orange',
    },
    {
      type: 'bucket',
      icon: FaBucket,
      label: t('Bucket Fill'),
      shortcut: 'G',
      description: t('Fill connected area with selected color'),
      colorScheme: 'teal',
    },
  ];

  const ToolButton: React.FC<{ tool: Tool }> = ({ tool }) => {
    const isSelected = selectedTool === tool.type;
    const IconComponent = tool.icon;

    return (
      <Tooltip
        label={
          <Box textAlign="center">
            <Box fontWeight="semibold">{tool.label}</Box>
            <Box fontSize="xs" opacity={0.8}>
              {tool.description}
            </Box>
            <Badge size="sm" variant="subtle" mt={1}>
              {tool.shortcut}
            </Badge>
          </Box>
        }
        placement={isVertical ? 'right' : 'top'}
      >
        <IconButton
          icon={<IconComponent />}
          aria-label={tool.label}
          size="sm"
          colorScheme={isSelected ? tool.colorScheme : 'gray'}
          variant={isSelected ? 'solid' : 'ghost'}
          onClick={() => onToolChange(tool.type)}
          isActive={isSelected}
          _active={{
            transform: 'scale(0.95)',
          }}
          transition="all 0.1s"
        />
      </Tooltip>
    );
  };

  if (isVertical) {
    return (
      <VStack spacing={1} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={1}>
        {TOOLS.map((tool) => (
          <ToolButton key={tool.type} tool={tool} />
        ))}
      </VStack>
    );
  }

  return (
    <ButtonGroup
      size="sm"
      isAttached
      variant="ghost"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
    >
      {TOOLS.map((tool) => (
        <ToolButton key={tool.type} tool={tool} />
      ))}
    </ButtonGroup>
  );
};

export default ToolSelectionSection;