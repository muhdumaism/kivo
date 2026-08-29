import { 
  Palette, Disc3, UserSquare2, Skull, Sparkles, UserCircle, Image, LayoutPanelTop, 
  Package, GitMerge, FileArchive, Calculator, Type, PenTool, Smile, Box
} from 'lucide-react';

export const TOOLS_CATEGORIES = {
  CREATE: 'Create',
  TOOLS: 'Tools'
};

export const toolsRegistry = [
  // CREATE
  {
    id: 'custom-paintings',
    name: 'Custom Paintings',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/custom-paintings',
    description: 'Upload images to create custom in-game paintings as a resource pack.',
    icon: Palette
  },
  {
    id: 'music-disc-maker',
    name: 'Music Disc Maker',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/music-disc-maker',
    description: 'Turn any audio file into a custom Minecraft music disc.',
    icon: Disc3
  },
  {
    id: 'armor-stand-skins',
    name: 'Armor Stand Skins',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/armor-stand-skins',
    description: 'Generate summon commands for posed armor stands wearing custom skins.',
    icon: UserSquare2
  },
  {
    id: 'player-heads',
    name: 'Player Heads',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/player-heads',
    description: 'Get summon commands for custom player heads by username.',
    icon: Skull
  },
  {
    id: 'totem-generator',
    name: 'Totem Generator',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/totem-generator',
    description: 'Upload an image to create a custom Totem of Undying resource pack.',
    icon: Sparkles
  },
  {
    id: 'cape-pack-builder',
    name: 'Cape Pack Builder',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/cape-pack-builder',
    description: 'Generate OptiFine-compatible cape resource packs.',
    icon: Box
  },
  {
    id: 'avatar-maker',
    name: 'Avatar Maker',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/avatar-maker',
    description: 'Render and export 2D/3D profile pictures from Minecraft skins.',
    icon: UserCircle
  },
  {
    id: 'hud-customizer',
    name: 'HUD Customizer',
    category: TOOLS_CATEGORIES.CREATE,
    route: '/create/hud-customizer',
    description: 'Customize crosshairs, hotbars, and UI elements into a resource pack.',
    icon: LayoutPanelTop
  },

  // TOOLS
  {
    id: 'skin-pack-maker',
    name: 'Skin Pack Maker',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/skin-pack-maker',
    description: 'Bundle multiple skins into a Bedrock Edition .mcpack.',
    icon: Package
  },
  {
    id: 'texture-pack-merger',
    name: 'Texture Pack Merger',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/texture-pack-merger',
    description: 'Combine multiple resource packs and resolve conflicts.',
    icon: GitMerge
  },
  {
    id: 'pack-converter',
    name: 'Pack Converter',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/pack-converter',
    description: 'Upgrade resource packs between different Minecraft versions.',
    icon: FileArchive
  },
  {
    id: 'coordinate-calculator',
    name: 'Coordinate Calculator',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/coordinate-calculator',
    description: 'Calculate Nether portals, regions, and chunks instantly.',
    icon: Calculator
  },
  {
    id: 'color-code-maker',
    name: 'Color Code Maker',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/color-code-maker',
    description: 'Generate Minecraft color codes and JSON text components.',
    icon: Type
  },
  {
    id: 'skin-editor',
    name: 'Skin Editor',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/skin-editor',
    description: 'Paint and edit Minecraft skins in a live 3D pixel editor.',
    icon: PenTool
  },
  {
    id: 'custom-emojis',
    name: 'Custom Emojis',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/custom-emojis',
    description: 'Generate Discord/Slack emojis from Minecraft skins.',
    icon: Smile
  },
  {
    id: 'cape-editor',
    name: 'Cape Editor',
    category: TOOLS_CATEGORIES.TOOLS,
    route: '/tools/cape-editor',
    description: 'Paint and edit custom capes in a live 3D pixel editor.',
    icon: Image
  }
];
