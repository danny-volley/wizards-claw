import { MaterialType } from '../objects/Material';

export interface SpellRecipe {
  id: string;
  name: string;
  description: string;
  materials: MaterialType[];
  difficulty: 1 | 2 | 3; // Affects timing window size
  discovered: boolean;
  effect: SpellEffect;
}

export interface SpellEffect {
  type: 'damage' | 'healing' | 'utility' | 'defensive';
  value: number;
  duration?: number; // For effects that last over time
  area?: 'single' | 'small' | 'large'; // For area effects
  description: string;
  defense?: number; // For spells that provide defense in addition to their main effect
}

export class SpellDatabase {
  private static recipes: Map<string, SpellRecipe> = new Map();
  
  static initialize(): void {
    // 1-Material Spells (Always available)
    this.addRecipe({
      id: 'ember',
      name: 'Ember',
      description: 'A small flame that burns the enemy',
      materials: [MaterialType.FIRE],
      difficulty: 1,
      discovered: true,
      effect: {
        type: 'damage',
        value: 25,
        area: 'single',
        description: '25 damage'
      }
    });
    
    this.addRecipe({
      id: 'vigor',
      name: 'Vigor',
      description: 'Nature\'s empowering energy',
      materials: [MaterialType.LEAF],
      difficulty: 1,
      discovered: true,
      effect: {
        type: 'healing',
        value: 20,
        area: 'single',
        description: '20 healing'
      }
    });
    
    this.addRecipe({
      id: 'shard',
      name: 'Shard',
      description: 'A jagged stone that deals damage and provides defense',
      materials: [MaterialType.ROCK],
      difficulty: 1,
      discovered: true,
      effect: {
        type: 'damage',
        value: 15,
        area: 'single',
        description: '15 damage + 15 defense',
        defense: 15
      }
    });
    
    // 2-Same Material Spells (Available if purchased in shop)
    this.addRecipe({
      id: 'strong_ember',
      name: 'Strong Ember',
      description: 'An intense flame that burns brighter',
      materials: [MaterialType.FIRE, MaterialType.FIRE],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 50,
        area: 'single',
        description: '50 damage'
      }
    });
    
    this.addRecipe({
      id: 'strong_vigor',
      name: 'Strong Vigor',
      description: 'Potent empowerment from concentrated nature',
      materials: [MaterialType.LEAF, MaterialType.LEAF],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'healing',
        value: 40,
        area: 'single',
        description: '40 healing'
      }
    });
    
    this.addRecipe({
      id: 'strong_shard',
      name: 'Strong Shard',
      description: 'Enhanced stone projectile that deals damage and provides defense',
      materials: [MaterialType.ROCK, MaterialType.ROCK],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 15,
        area: 'single',
        description: '15 damage + 15 defense',
        defense: 15
      }
    });
    
    // 2-Different Material Spells (Need to be discovered)
    this.addRecipe({
      id: 'smoke_cloud',
      name: 'Smoke Cloud',
      description: 'Fire and leaf create confusing smoke',
      materials: [MaterialType.FIRE, MaterialType.LEAF],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 25,
        duration: 1,
        area: 'single',
        description: '25 damage + 20 healing'
      }
    });
    
    this.addRecipe({
      id: 'molten_shard',
      name: 'Molten Shard',
      description: 'Fire-heated rock that weakens enemies',
      materials: [MaterialType.FIRE, MaterialType.ROCK],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 35,
        duration: 2,
        area: 'single',
        description: '35 damage + 15 defense'
      }
    });
    
    this.addRecipe({
      id: 'healing_stone',
      name: 'Healing Stone',
      description: 'Earth-infused with nature\'s restorative power',
      materials: [MaterialType.LEAF, MaterialType.ROCK],
      difficulty: 2,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'healing',
        value: 30,
        area: 'single',
        description: '10 damage + 20 healing + 15 defense'
      }
    });
    
    // 3-Material Spells (Advanced combinations, need to be discovered)
    this.addRecipe({
      id: 'inferno',
      name: 'Inferno',
      description: 'Ultimate fire magic consuming all elements',
      materials: [MaterialType.FIRE, MaterialType.FIRE, MaterialType.FIRE],
      difficulty: 3,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 75,
        area: 'large',
        description: '75 damage'
      }
    });
    
    this.addRecipe({
      id: 'elemental_storm',
      name: 'Elemental Storm',
      description: 'All three elements unite in devastating harmony',
      materials: [MaterialType.FIRE, MaterialType.LEAF, MaterialType.ROCK],
      difficulty: 3,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'damage',
        value: 25,
        duration: 1,
        area: 'large',
        description: '25 damage + 20 healing'
      }
    });
    
    this.addRecipe({
      id: 'sanctuary',
      name: 'Sanctuary',
      description: 'Nature and earth create an impenetrable refuge',
      materials: [MaterialType.LEAF, MaterialType.ROCK, MaterialType.LEAF],
      difficulty: 3,
      discovered: true, // Available for demo - would be unlocked via shop
      effect: {
        type: 'defensive',
        value: 8,
        duration: 3,
        area: 'single',
        description: 'Gain 8 armor and immunity to debuffs for 3 turns'
      }
    });
    
    // Always available utility spell
    this.addRecipe({
      id: 'gather',
      name: 'Gather',
      description: 'Collect materials from the environment',
      materials: [],
      difficulty: 1,
      discovered: true,
      effect: {
        type: 'utility',
        value: 5,
        area: 'single',
        description: '+5 materials'
      }
    });
  }
  
  private static addRecipe(recipe: SpellRecipe): void {
    this.recipes.set(recipe.id, recipe);
  }
  
  static getRecipe(id: string): SpellRecipe | undefined {
    return this.recipes.get(id);
  }
  
  static getAllRecipes(): SpellRecipe[] {
    return Array.from(this.recipes.values());
  }
  
  static getDiscoveredRecipes(): SpellRecipe[] {
    return this.getAllRecipes().filter(recipe => 
      recipe.discovered && recipe.materials.length <= 2 // Exclude 3-material spells for now
    );
  }
  
  static getAvailableSpells(materials: MaterialType[]): SpellRecipe[] {
    return this.getDiscoveredRecipes().filter(recipe => 
      this.canCastSpell(recipe.materials, materials)
    );
  }
  
  static canCastSpell(required: MaterialType[], available: MaterialType[]): boolean {
    if (required.length === 0) return true; // Gather spell
    if (required.length > available.length) return false;
    
    // Create copies to avoid modifying original arrays
    const requiredCopy = [...required];
    const availableCopy = [...available];
    
    // Check if we have all required materials
    for (const material of requiredCopy) {
      const index = availableCopy.indexOf(material);
      if (index === -1) return false;
      availableCopy.splice(index, 1); // Remove used material
    }
    
    return true;
  }
  
  static discoverRecipe(id: string): boolean {
    const recipe = this.recipes.get(id);
    if (recipe && !recipe.discovered) {
      recipe.discovered = true;
      return true;
    }
    return false;
  }
  
  static findRecipeByMaterials(materials: MaterialType[]): SpellRecipe | undefined {
    // Sort materials for consistent matching
    const sortedMaterials = [...materials].sort();
    
    return this.getDiscoveredRecipes().find(recipe => {
      const sortedRequired = [...recipe.materials].sort();
      return sortedRequired.length === sortedMaterials.length &&
             sortedRequired.every((material, index) => material === sortedMaterials[index]);
    });
  }
  
  static getTimingWindowSize(difficulty: 1 | 2 | 3): number {
    // Returns timing window size in pixels (larger = easier)
    switch (difficulty) {
      case 1: return 60; // Easy timing for 1-material spells
      case 2: return 40; // Medium timing for 2-material spells  
      case 3: return 25; // Hard timing for 3-material spells
      default: return 40;
    }
  }
}