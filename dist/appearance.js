import {renderStudentPortrait} from './student-pixel-art.js';

// Global standard hair palettes: Blonde, Red, Brown, Black
export const HAIR_PALETTES = {
  // Blonde (Platinum, Honey, Golden)
  platinumBlonde: { id: 'platinumBlonde', label: 'Platinum blonde', category: 'blonde', base: '#ede2c8', highlight: '#fbf7ee', mid: '#f1e6cd', shadow: '#b59e75' },
  honeyBlonde: { id: 'honeyBlonde', label: 'Honey blonde', category: 'blonde', base: '#d8ab58', highlight: '#f5d98b', mid: '#e2ba6d', shadow: '#966d2d' },
  goldenBlonde: { id: 'goldenBlonde', label: 'Golden blonde', category: 'blonde', base: '#c6953f', highlight: '#ebc574', mid: '#d2a450', shadow: '#835c1e' },
  // Red (Ginger, Auburn, Copper red)
  ginger: { id: 'ginger', label: 'Ginger', category: 'red', base: '#ba532d', highlight: '#e88258', mid: '#cb653d', shadow: '#772d15' },
  auburn: { id: 'auburn', label: 'Auburn', category: 'red', base: '#87382a', highlight: '#b95b47', mid: '#994433', shadow: '#531d14' },
  copperRed: { id: 'copperRed', label: 'Copper red', category: 'red', base: '#a4462a', highlight: '#d76f4e', mid: '#b45233', shadow: '#6a2514' },
  // Brown (Chestnut, Warm brunette, Espresso)
  chestnutBrown: { id: 'chestnutBrown', label: 'Chestnut brown', category: 'brown', base: '#614032', highlight: '#8a6250', mid: '#6e4c3c', shadow: '#3c251d' },
  warmBrunette: { id: 'warmBrunette', label: 'Warm brunette', category: 'brown', base: '#4a3328', highlight: '#735242', mid: '#583e31', shadow: '#2d1d16' },
  espresso: { id: 'espresso', label: 'Espresso', category: 'brown', base: '#33231c', highlight: '#563e34', mid: '#402e25', shadow: '#1c120e' },
  // Black (Jet black, Soft charcoal black)
  jetBlack: { id: 'jetBlack', label: 'Jet black', category: 'black', base: '#1a1b20', highlight: '#424552', mid: '#2c2e37', shadow: '#0e0f13' },
  softCharcoalBlack: { id: 'softCharcoalBlack', label: 'Soft charcoal black', category: 'black', base: '#2a2b30', highlight: '#545663', mid: '#3b3d46', shadow: '#17181c' },
};

export const HAIR_COLORS = Object.values(HAIR_PALETTES).map(p => p.base);

// Global skin tone spectrum from fair pale, porcelain, warm beige, tan, amber, bronze, deep brown, espresso to obsidian
export const SKIN_ANCHORS = ['#f8ded2', '#f2d2bb', '#e5b99b', '#d39e78', '#be8258', '#9d603a', '#7a4024', '#522917', '#351a0e'];

export const HIJAB_PALETTES = [
  '#9b6b78', // Dusty rose / Mauve
  '#2d3b55', // Deep navy
  '#536b5c', // Sage green / Olive
  '#8c6d53', // Warm camel / Taupe
  '#dcd4c5', // Pearl cream / Ivory
  '#3d424d', // Slate charcoal
  '#6b3b4d', // Burgundy / Plum
  '#3b6b73', // Soft teal
];

export function skinTone(sample) {
  const anchors = SKIN_ANCHORS;
  const position = Math.max(0, Math.min(1, sample)) * (anchors.length - 1);
  const index = Math.min(anchors.length - 2, Math.floor(position));
  const fraction = position - index;
  return '#' + anchors[index].slice(1).match(/../g).map((v, i) => Math.round(parseInt(v, 16) * (1 - fraction) + parseInt(anchors[index + 1].slice(1 + i * 2, 3 + i * 2), 16) * fraction).toString(16).padStart(2, '0')).join('');
}

// Independent cosmetic RNG: appearance never changes ability or simulation rolls.
export function studentAppearance(seed, gender, options = {}) {
  let n = Number(seed) >>> 0;
  const rand = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return (n + .5) / 4294967296;
  };
  const mean = gender === 'male' ? 2 : gender === 'female' ? 3.5 : 3.5;
  const gaussian = Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
  const rare = rand();
  const hairLength = options.hairLength ?? (rare < (gender === 'male' ? .006 : 0) ? 0 : Math.max(1, Math.min(6, gender === 'female' ? 1 + Math.floor(rare * 6) : Math.round(mean + gaussian * .85))));
  const hairDraw = rand();
  const hair = options.hair ?? HAIR_COLORS[Math.floor(hairDraw * HAIR_COLORS.length)];
  const skin = options.skin ?? skinTone(rand());
  const shirt = options.shirt ?? ['#456c87', '#597a68', '#906b71', '#6c6587'][Math.floor(rand() * 4)];
  const glasses = options.glasses ?? (rand() < .3);
  const eyes = options.eyes ?? Math.floor(rand() * 3);
  const face = options.face ?? Math.floor(rand() * 3);
  const outfit = options.outfit ?? Math.floor(rand() * 6);
  const fringe = options.fringe ?? Math.floor(rand() * 16);
  const brows = options.brows ?? Math.floor(rand() * 3);
  const glassesShape = options.glassesShape ?? Math.floor(rand() * 2);
  const curly = options.curly ?? (((Math.imul(Number(seed) ^ 0x37ac, 2654435761) >>> 0) % 5) === 0);

  const isExplicitHijab = Boolean(options.hijab || options.headwear === 'hijab' || options.hairStyle === 'hijab');
  const isExplicitAfro = Boolean(options.afro || options.hairStyle === 'afro');
  const isExplicitCoily = Boolean(options.coily || options.hairStyle === 'coily');

  const afro = options.afro ?? (isExplicitAfro || (!isExplicitHijab && options.hairStyle === undefined && hairLength >= 1 && hairLength <= 4 && ((Math.imul(Number(seed) ^ 0x62e1, 2654435761) >>> 0) % 18) === 0));
  const hijab = options.hijab ?? isExplicitHijab;
  const coily = options.coily ?? (isExplicitCoily || (curly && ((Math.imul(Number(seed) ^ 0x48df, 2654435761) >>> 0) % 2) === 0));

  const hairStyle = options.hairStyle ?? (hijab ? 'hijab' : afro ? 'afro' : hairLength === 0 ? 'buzz' : coily ? 'coily' : curly ? 'curly' : 'standard');
  const hijabColor = options.hijabColor ?? (hijab ? HIJAB_PALETTES[(fringe + outfit) % HIJAB_PALETTES.length] : undefined);

  return {
    hairLength,
    hair,
    skin,
    shirt,
    glasses,
    eyes,
    face,
    outfit,
    fringe,
    brows,
    glassesShape,
    curly,
    afro,
    coily,
    hijab,
    hairStyle,
    ...(hijabColor ? { hijabColor } : {}),
    ...options,
  };
}

export const renderPortrait = renderStudentPortrait;

export function weeklyAppearance(state, index = 0) {
  const base = state.appearance ?? studentAppearance(state.creationSeed ?? state.seed, state.gender);
  const a = { ...base };
  const month = state.visualMonth ?? state.month;
  const sequence = (a.outfit + Math.max(0, state.month - 1) * 5 + index);
  const outfit = state.professorProfile?.labMode === 'dry' ? 1 + sequence % 5 : sequence % 6;
  const militaryBuzz = state.gender === 'male' && state.service?.trainingReturnMonth !== undefined &&
    ((month >= state.service.trainingReturnMonth && month < state.service.trainingReturnMonth + 2) || (month === state.service.trainingStartMonth && index >= 3));
  return {
    ...a,
    ...(militaryBuzz ? { hairLength: 0, hairStyle: 'buzz', afro: false, coily: false, curly: false } : {}),
    outfit,
    shirt: ['#456c87', '#597a68', '#906b71', '#6c6587', '#ba8659', '#548b98'][(a.outfit + index + state.month) % 6],
  };
}

