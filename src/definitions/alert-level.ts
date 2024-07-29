interface AlertLevelDefinition {
  heading: string;
  subheading?: string;
  showViewport: boolean;
}

export const alertLevels: Map<number, AlertLevelDefinition> = new Map([
  [1, { heading: 'Alert Level 1: Expansion', subheading: 'Instructions for Expansion...', showViewport: false }],
  [2, { heading: 'Alert Level 2: Territorial Defence', showViewport: true }],
  [3, { heading: 'Alert Level 3: Update Artwork', subheading: 'Instructions for Updating Artwork...', showViewport: false }],
  [4, { heading: 'Alert Level 4: Defend Ally', subheading: 'Instructions for Defending Ally...', showViewport: false }],
]);

export const validAlertLevels = Array.from(alertLevels.keys());