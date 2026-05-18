// =============================================================================
// Available Arma 3 Fonts
// =============================================================================

export interface FontEntry {
  name: string;
  family: string;
  weight: string;
  description: string;
}

export const FONT_LIST: FontEntry[] = [
  { name: 'RobotoCondensed', family: 'Roboto Condensed', weight: '400', description: 'Standard UI font, good readability at small sizes.' },
  { name: 'RobotoCondensedBold', family: 'Roboto Condensed', weight: '700', description: 'Bold variant for headers and emphasis.' },
  { name: 'RobotoCondensedLight', family: 'Roboto Condensed', weight: '300', description: 'Light variant for subtle text.' },
  { name: 'PuristaLight', family: 'Purista', weight: '300', description: 'Military-styled light font, used in HUD elements.' },
  { name: 'PuristaMedium', family: 'Purista', weight: '500', description: 'Military-styled medium font.' },
  { name: 'PuristaSemiBold', family: 'Purista', weight: '600', description: 'Military-styled semibold font.' },
  { name: 'PuristaBold', family: 'Purista', weight: '700', description: 'Military-styled bold font.' },
  { name: 'EtelkaNarrowMediumPro', family: 'Etelka Narrow', weight: '500', description: 'Narrow proportional font. Good for listboxes and dense text.' },
  { name: 'EtelkaMonospacePro', family: 'Etelka Monospace', weight: '400', description: 'Monospace variant of Etelka. Good for code/console displays.' },
  { name: 'EtelkaMonospaceProBold', family: 'Etelka Monospace', weight: '700', description: 'Bold monospace. Good for console header text.' },
  { name: 'LCD14', family: 'LCD', weight: '400', description: 'Small LCD display font, 14px. Used for digital readouts.' },
  { name: 'TahomaB', family: 'Tahoma', weight: '700', description: 'Bold Tahoma. Fallback font with broad character support.' },
];

export function getFontNames(): string[] {
  return FONT_LIST.map(f => f.name);
}
