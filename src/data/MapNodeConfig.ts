export enum MapNodeType {
  CAMPFIRE = 'campfire',
  ENCOUNTER = 'encounter',
  SHOP = 'shop',
  TREASURE = 'treasure',
  HAZARD = 'hazard',
  BOSS = 'boss'
}

export interface MapNodeConfig {
  type: MapNodeType;
  name: string;
  description: string;
  iconAsset: string;
  difficultyModifier: number; // Multiplier for encounter difficulty (1.0 = normal, 1.5 = hard)
  rewardAmount: number; // Base reward amount (materials, gold, etc.)
  isRequired: boolean; // Whether this node must be completed to progress
  canBeRepeated: boolean; // Whether the node can be visited multiple times
  unlockConditions?: string[]; // What must be completed to unlock this node
  special?: {
    healAmount?: number; // For campfire nodes
    shopItems?: string[]; // For shop nodes
    treasureType?: string; // For treasure nodes
    hazardType?: string; // For hazard nodes
    bossName?: string; // For boss nodes
  };
}

export const MAP_NODE_CONFIGS: Record<MapNodeType, MapNodeConfig> = {
  [MapNodeType.CAMPFIRE]: {
    type: MapNodeType.CAMPFIRE,
    name: 'Campfire',
    description: 'Rest and recover at a safe campfire. Restore health and advance the story.',
    iconAsset: 'map_campfire',
    difficultyModifier: 0, // No combat difficulty
    rewardAmount: 0, // No material rewards
    isRequired: true,
    canBeRepeated: false,
    special: {
      healAmount: 100 // Full heal
    }
  },
  
  [MapNodeType.ENCOUNTER]: {
    type: MapNodeType.ENCOUNTER,
    name: 'Encounter',
    description: 'Face enemies in combat. Gain materials and experience.',
    iconAsset: 'map_encounter',
    difficultyModifier: 1.0, // Normal difficulty
    rewardAmount: 15, // Base material reward
    isRequired: false,
    canBeRepeated: true
  },
  
  [MapNodeType.SHOP]: {
    type: MapNodeType.SHOP,
    name: 'Shop',
    description: 'Purchase spell upgrades and useful items.',
    iconAsset: 'map_shop',
    difficultyModifier: 0, // No combat
    rewardAmount: 0, // No direct rewards
    isRequired: false,
    canBeRepeated: true,
    special: {
      shopItems: ['spell_upgrade', 'health_potion', 'material_pouch']
    }
  },
  
  [MapNodeType.TREASURE]: {
    type: MapNodeType.TREASURE,
    name: 'Treasure',
    description: 'Discover valuable materials and rare items.',
    iconAsset: 'map_treasure',
    difficultyModifier: 0, // No combat (usually)
    rewardAmount: 25, // Higher reward than normal encounter
    isRequired: false,
    canBeRepeated: false,
    special: {
      treasureType: 'materials_cache'
    }
  },
  
  [MapNodeType.HAZARD]: {
    type: MapNodeType.HAZARD,
    name: 'Hazard',
    description: 'Navigate dangerous terrain or environmental challenges.',
    iconAsset: 'map_hazard',
    difficultyModifier: 1.2, // Slightly harder than normal
    rewardAmount: 20, // Good reward for the risk
    isRequired: false,
    canBeRepeated: false,
    special: {
      hazardType: 'environmental'
    }
  },
  
  [MapNodeType.BOSS]: {
    type: MapNodeType.BOSS,
    name: 'Boss',
    description: 'Face a powerful enemy in an epic battle.',
    iconAsset: 'map_boss',
    difficultyModifier: 2.0, // Much harder than normal
    rewardAmount: 50, // Excellent rewards
    isRequired: true,
    canBeRepeated: false,
    unlockConditions: ['previous_area_complete'],
    special: {
      bossName: 'area_boss'
    }
  }
};

// Difficulty variants for encounter nodes
export const ENCOUNTER_VARIANTS = {
  EASY: {
    difficultyModifier: 0.8,
    rewardAmount: 10,
    name: 'Easy Encounter'
  },
  NORMAL: {
    difficultyModifier: 1.0,
    rewardAmount: 15,
    name: 'Encounter'
  },
  HARD: {
    difficultyModifier: 1.5,
    rewardAmount: 25,
    name: 'Hard Encounter'
  }
};

// Helper function to get node configuration
export function getNodeConfig(type: MapNodeType): MapNodeConfig {
  return MAP_NODE_CONFIGS[type];
}

// Helper function to create a customized node config
export function createCustomNodeConfig(
  baseType: MapNodeType, 
  overrides: Partial<MapNodeConfig>
): MapNodeConfig {
  const baseConfig = MAP_NODE_CONFIGS[baseType];
  return {
    ...baseConfig,
    ...overrides
  };
}