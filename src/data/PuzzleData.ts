export enum PuzzleType {
  DAMAGE = 'damage',
  BLOCKING = 'blocking'
}

export interface PuzzleHazard {
  id: string;
  type: PuzzleType;
  displayName: string;
  description: string;
  assetKey: string;
  baseDifficulty: number;
  scaling: PuzzleScaling;
}

export interface PuzzleScaling {
  targetMultiplier: number;    // How much the target scales per difficulty level
  timeMultiplier: number;      // How much time scales per difficulty level (less time = harder)
  minTime: number;             // Minimum time allowed
  maxTime: number;             // Maximum time allowed
  minTarget: number;           // Minimum target value
  maxTarget: number;           // Maximum target value
}

export interface PuzzleConfig {
  hazard: PuzzleHazard;
  target: number;              // Amount of damage/blocking required
  timeLimit: number;           // Time limit in seconds
  difficultyLevel: number;     // Current difficulty level
}

export const PuzzleHazardDatabase: { [key: string]: PuzzleHazard } = {
  thorn_bush: {
    id: 'thorn_bush',
    type: PuzzleType.DAMAGE,
    displayName: 'Thorn Bush',
    description: 'A dangerous thorn bush blocking your path',
    assetKey: 'wiz_enemy_crane', // Placeholder - reuse crane asset for now
    baseDifficulty: 1,
    scaling: {
      targetMultiplier: 1.3,     // 30% more damage needed per level
      timeMultiplier: 0.9,       // 10% less time per level
      minTime: 90,               // Minimum 30 seconds
      maxTime: 120,               // Maximum 90 seconds
      minTarget: 80,             // Minimum 50 damage
      maxTarget: 300             // Maximum 300 damage
    }
  },
  
  falling_rocks: {
    id: 'falling_rocks',
    type: PuzzleType.BLOCKING,
    displayName: 'Falling Rocks',
    description: 'Rocks are falling from above - block the damage!',
    assetKey: 'wiz_enemy_lizard', // Placeholder - reuse lizard asset for now
    baseDifficulty: 1,
    scaling: {
      targetMultiplier: 1.2,     // 20% more blocking needed per level
      timeMultiplier: 0.8,      // 15% less time per level
      minTime: 90,               // Minimum 40 seconds
      maxTime: 120,               // Maximum 75 seconds
      minTarget: 50,             // Minimum 60 blocking
      maxTarget: 200             // Maximum 250 blocking
    }
  },
  
  fire_trap: {
    id: 'fire_trap',
    type: PuzzleType.DAMAGE,
    displayName: 'Fire Trap',
    description: 'A magical fire trap must be extinguished',
    assetKey: 'wiz_enemy_fox', // Placeholder - reuse fox asset for now
    baseDifficulty: 2,
    scaling: {
      targetMultiplier: 1.4,     // 40% more damage needed per level
      timeMultiplier: 0.8,       // 20% less time per level
      minTime: 90,               // Minimum 25 seconds
      maxTime: 120,               // Maximum 70 seconds
      minTarget: 80,             // Minimum 80 damage
      maxTarget: 400             // Maximum 400 damage
    }
  },
  
  ice_barrier: {
    id: 'ice_barrier',
    type: PuzzleType.BLOCKING,
    displayName: 'Ice Barrier',
    description: 'An ice barrier is sending freezing attacks',
    assetKey: 'wiz_enemy_crane', // Placeholder - reuse crane asset for now
    baseDifficulty: 2,
    scaling: {
      targetMultiplier: 1.2,    // 25% more blocking needed per level
      timeMultiplier: 0.8,      // 20% less time per level
      minTime: 90,               // Minimum 35 seconds
      maxTime: 120,               // Maximum 60 seconds
      minTarget: 50,             // Minimum 90 blocking
      maxTarget: 200             // Maximum 350 blocking
    }
  }
};

export class PuzzleGenerator {
  private static getRandomHazardByType(type: PuzzleType): PuzzleHazard {
    const hazards = Object.values(PuzzleHazardDatabase).filter(h => h.type === type);
    return hazards[Math.floor(Math.random() * hazards.length)];
  }
  
  private static getRandomHazard(): PuzzleHazard {
    const hazards = Object.values(PuzzleHazardDatabase);
    return hazards[Math.floor(Math.random() * hazards.length)];
  }
  
  public static generatePuzzle(difficultyLevel: number = 1, forceType?: PuzzleType): PuzzleConfig {
    const hazard = forceType 
      ? this.getRandomHazardByType(forceType)
      : this.getRandomHazard();
    
    const scaling = hazard.scaling;
    const adjustedDifficulty = Math.max(1, difficultyLevel - hazard.baseDifficulty + 1);
    
    // Calculate target based on scaling
    const baseTarget = scaling.minTarget;
    const scaledTarget = Math.round(baseTarget * Math.pow(scaling.targetMultiplier, adjustedDifficulty - 1));
    const target = Math.min(scaling.maxTarget, Math.max(scaling.minTarget, scaledTarget));
    
    // Calculate time limit based on scaling
    const baseTime = scaling.maxTime;
    const scaledTime = Math.round(baseTime * Math.pow(scaling.timeMultiplier, adjustedDifficulty - 1));
    const timeLimit = Math.min(scaling.maxTime, Math.max(scaling.minTime, scaledTime));
    
    return {
      hazard,
      target,
      timeLimit,
      difficultyLevel
    };
  }
  
  public static getHazard(hazardId: string): PuzzleHazard | null {
    return PuzzleHazardDatabase[hazardId] || null;
  }
  
  public static getAllHazards(): PuzzleHazard[] {
    return Object.values(PuzzleHazardDatabase);
  }
  
  public static getHazardsByType(type: PuzzleType): PuzzleHazard[] {
    return Object.values(PuzzleHazardDatabase).filter(h => h.type === type);
  }
}