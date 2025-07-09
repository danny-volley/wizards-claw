export interface EnemyData {
  id: string;
  name: string;
  displayName: string;
  maxHealth: number;
  damage: number;
  assetKey: string;
  scale: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  encounterTypes: string[]; // Which encounter types this enemy can appear in
}

export const ENEMY_DATABASE: Record<string, EnemyData> = {
  lizard: {
    id: 'lizard',
    name: 'lizard',
    displayName: 'Swamp Lizard',
    maxHealth: 100,
    damage: 15,
    assetKey: 'battle_lizard',
    scale: 0.35,
    description: 'A fierce lizard from the swamplands',
    difficulty: 'easy',
    encounterTypes: ['combat']
  },
  
  fox: {
    id: 'fox',
    name: 'fox',
    displayName: 'Cunning Fox',
    maxHealth: 80,
    damage: 12,
    assetKey: 'battle_fox',
    scale: 0.4,
    description: 'A clever fox that uses tricks in battle',
    difficulty: 'easy',
    encounterTypes: ['combat', 'prey_hunt']
  },
  
  crane: {
    id: 'crane',
    name: 'crane',
    displayName: 'Sky Crane',
    maxHealth: 120,
    damage: 20,
    assetKey: 'battle_crane',
    scale: 0.45,
    description: 'A majestic crane with wind magic',
    difficulty: 'medium',
    encounterTypes: ['combat']
  },
  
  // Placeholder enemies for future encounters
  shadow_wolf: {
    id: 'shadow_wolf',
    name: 'shadow_wolf',
    displayName: 'Shadow Wolf',
    maxHealth: 150,
    damage: 25,
    assetKey: 'enemy_shadow_wolf',
    scale: 0.5,
    description: 'A wolf wreathed in dark magic',
    difficulty: 'hard',
    encounterTypes: ['combat']
  },
  
  crystal_spider: {
    id: 'crystal_spider',
    name: 'crystal_spider',
    displayName: 'Crystal Spider',
    maxHealth: 60,
    damage: 10,
    assetKey: 'enemy_crystal_spider',
    scale: 0.3,
    description: 'A spider made of living crystal',
    difficulty: 'easy',
    encounterTypes: ['combat', 'trap']
  }
};

export class EnemyDatabase {
  public static getEnemy(id: string): EnemyData | null {
    return ENEMY_DATABASE[id] || null;
  }
  
  public static getAllEnemies(): EnemyData[] {
    return Object.values(ENEMY_DATABASE);
  }
  
  public static getEnemiesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): EnemyData[] {
    return Object.values(ENEMY_DATABASE).filter(enemy => enemy.difficulty === difficulty);
  }
  
  public static getEnemiesForEncounterType(encounterType: string): EnemyData[] {
    return Object.values(ENEMY_DATABASE).filter(enemy => 
      enemy.encounterTypes.includes(encounterType)
    );
  }
}