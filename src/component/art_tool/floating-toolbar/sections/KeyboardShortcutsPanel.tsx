import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';

export interface KeyboardShortcutsPanelProps {}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    note?: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'File Operations',
    shortcuts: [
      {
        keys: ['Ctrl', 'S'],
        description: 'Save design',
        note: 'Cmd+S on Mac',
      },
      {
        keys: ['Esc'],
        description: 'Cancel editing',
      },
      {
        keys: ['F2'],
        description: 'Edit design name',
      },
    ],
  },
  {
    title: 'Edit Operations', 
    shortcuts: [
      {
        keys: ['Ctrl', 'Z'],
        description: 'Undo',
        note: 'Cmd+Z on Mac',
      },
      {
        keys: ['Ctrl', 'Y'],
        description: 'Redo',
        note: 'Ctrl+Shift+Z or Cmd+Y on Mac',
      },
      {
        keys: ['Ctrl', 'C'],
        description: 'Copy selection',
        note: 'Cmd+C on Mac',
      },
      {
        keys: ['Ctrl', 'V'],
        description: 'Paste at cursor',
        note: 'Cmd+V on Mac',
      },
      {
        keys: ['F'],
        description: 'Fill selection',
        note: 'with selected color',
      },
      {
        keys: ['Delete'],
        description: 'Erase selection',
        note: 'or Backspace',
      },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      {
        keys: ['B'],
        description: 'Paint tool',
      },
      {
        keys: ['E'],
        description: 'Erase tool',
      },
      {
        keys: ['S'],
        description: 'Select tool',
      },
      {
        keys: ['I'],
        description: 'Eyedropper tool',
      },
    ],
  },
  {
    title: 'Selection & Editing',
    shortcuts: [
      {
        keys: ['Ctrl', 'Drag'],
        description: 'Create selection',
        note: 'to copy pixels',
      },
      {
        keys: ['Double Click'],
        description: 'Fill selection',
        note: 'with clicked color',
      },
      {
        keys: ['Enter'],
        description: 'Confirm name edit',
        note: 'when editing design name',
      },
      {
        keys: ['Esc'],
        description: 'Cancel name edit',
        note: 'when editing design name',
      },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      {
        keys: ['Mouse Wheel'],
        description: 'Zoom in/out',
      },
      {
        keys: ['Middle Mouse', 'Drag'],
        description: 'Pan canvas',
        note: 'works during editing',
      },
      {
        keys: ['Right Mouse', 'Drag'],
        description: 'Pan canvas',
        note: 'when not editing',
      },
      {
        keys: ['Left Mouse', 'Drag'],
        description: 'Paint pixels',
        note: 'with paint/erase tool',
      },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      {
        keys: ['?'],
        description: 'Toggle shortcuts',
        note: 'or F1',
      },
    ],
  },
];

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = () => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const ShortcutItem: React.FC<{
    keys: string[];
    description: string;
    note?: string;
  }> = ({ keys, description, note }) => (
    <Flex justify="space-between" align="center" py={1}>
      <HStack spacing={1}>
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <Text fontSize="xs">+</Text>}
            <Badge
              variant="outline"
              fontSize="xs"
              fontFamily="mono"
              px={2}
              py={1}
            >
              {key}
            </Badge>
          </React.Fragment>
        ))}
      </HStack>
      <Box flex={1} ml={3} textAlign="right">
        <Text fontSize="sm">{description}</Text>
        {note && (
          <Text fontSize="xs" opacity={0.7}>
            {note}
          </Text>
        )}
      </Box>
    </Flex>
  );

  const ShortcutGroup: React.FC<{ group: ShortcutGroup }> = ({ group }) => (
    <Box>
      <Text fontWeight="semibold" fontSize="sm" mb={2} color="blue.500">
        {group.title}
      </Text>
      <VStack spacing={1} align="stretch">
        {group.shortcuts.map((shortcut, index) => (
          <ShortcutItem
            key={index}
            keys={shortcut.keys}
            description={shortcut.description}
            note={shortcut.note}
          />
        ))}
      </VStack>
    </Box>
  );

  return (
    <>
      {/* Shortcuts Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {SHORTCUT_GROUPS.map((group, index) => (
          <ShortcutGroup key={index} group={group} />
        ))}
      </SimpleGrid>

      {/* Footer note */}
      <Box mt={4} pt={3} borderTop="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" opacity={0.8} textAlign="center">
          Tip: Shortcuts work when canvas is focused. Some shortcuts are disabled when editing design name.
        </Text>
      </Box>
    </>
  );
};

export default KeyboardShortcutsPanel;