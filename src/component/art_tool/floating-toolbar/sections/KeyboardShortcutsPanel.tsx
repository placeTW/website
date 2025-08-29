import React from 'react';
import { useTranslation } from 'react-i18next';
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


export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = () => {
  const { t } = useTranslation();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
      title: t('File Operations'),
      shortcuts: [
        {
          keys: ['Ctrl', 'S'],
          description: t('Save design'),
          note: t('Cmd+S on Mac'),
        },
        {
          keys: ['Esc'],
          description: t('Cancel editing'),
        },
        {
          keys: ['F2'],
          description: t('Edit design name'),
        },
      ],
    },
    {
      title: t('Edit Operations'), 
      shortcuts: [
        {
          keys: ['Ctrl', 'Z'],
          description: t('Undo'),
          note: t('Cmd+Z on Mac'),
        },
        {
          keys: ['Ctrl', 'Y'],
          description: t('Redo'),
          note: t('Ctrl+Shift+Z or Cmd+Y on Mac'),
        },
        {
          keys: ['Ctrl', 'C'],
          description: t('Copy selection'),
          note: t('Cmd+C on Mac'),
        },
        {
          keys: ['Ctrl', 'V'],
          description: t('Paste at cursor'),
          note: t('Cmd+V on Mac'),
        },
        {
          keys: ['F'],
          description: t('Fill selection'),
          note: t('with selected color'),
        },
        {
          keys: ['Delete'],
          description: t('Erase selection'),
          note: t('or Backspace'),
        },
      ],
    },
    {
      title: t('Tools'),
      shortcuts: [
        {
          keys: ['B'],
          description: t('Paint tool'),
        },
        {
          keys: ['E'],
          description: t('Erase tool'),
        },
        {
          keys: ['S'],
          description: t('Select tool'),
        },
        {
          keys: ['I'],
          description: t('Eyedropper tool'),
        },
        {
          keys: ['G'],
          description: t('Bucket fill tool'),
        },
      ],
    },
    {
      title: t('Selection & Editing'),
      shortcuts: [
        {
          keys: ['Ctrl', 'Drag'],
          description: t('Create selection'),
          note: t('to copy pixels'),
        },
        {
          keys: ['Double Click'],
          description: t('Fill selection'),
          note: t('with clicked color'),
        },
        {
          keys: ['Enter'],
          description: t('Confirm name edit'),
          note: t('when editing design name'),
        },
        {
          keys: ['Esc'],
          description: t('Cancel name edit'),
          note: t('when editing design name'),
        },
      ],
    },
    {
      title: t('Navigation'),
      shortcuts: [
        {
          keys: ['Mouse Wheel'],
          description: t('Zoom in/out'),
        },
        {
          keys: ['Middle Mouse', 'Drag'],
          description: t('Pan canvas'),
          note: t('works during editing'),
        },
        {
          keys: ['Right Mouse', 'Drag'],
          description: t('Pan canvas'),
          note: t('when not editing'),
        },
        {
          keys: ['Left Mouse', 'Drag'],
          description: t('Paint pixels'),
          note: t('with paint/erase tool'),
        },
      ],
    },
    {
      title: t('Help'),
      shortcuts: [
        {
          keys: ['?'],
          description: t('Toggle shortcuts'),
          note: t('or F1'),
        },
      ],
    },
  ];

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
          {t('Tip: Shortcuts work when canvas is focused. Some shortcuts are disabled when editing design name.')}
        </Text>
      </Box>
    </>
  );
};

export default KeyboardShortcutsPanel;