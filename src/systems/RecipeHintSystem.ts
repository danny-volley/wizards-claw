import { MaterialType } from '../objects/Material';
import { SpellDatabase, SpellRecipe } from './SpellDatabase';

export interface RecipeHint {
  description: string;
  materials: MaterialType[];
  spell: SpellRecipe;
  isDiscovered: boolean;
  isAvailable: boolean;
}

export class RecipeHintSystem {
  private scene: Phaser.Scene;
  private hintContainer: Phaser.GameObjects.Container | null = null;
  private showingHints: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public generateHints(currentMaterials: MaterialType[]): RecipeHint[] {
    const hints: RecipeHint[] = [];
    const allRecipes = SpellDatabase.getAllRecipes().filter(recipe => 
      recipe.materials.length <= 2 // Exclude 3-material spells for now
    );
    const discoveredRecipes = SpellDatabase.getDiscoveredRecipes();
    
    // Group hints by availability and discovery status
    for (const recipe of allRecipes) {
      const isDiscovered = discoveredRecipes.some(discovered => discovered.id === recipe.id);
      const canCast = SpellDatabase.canCastSpell(recipe.materials, currentMaterials);
      
      hints.push({
        description: this.generateHintDescription(recipe, currentMaterials, isDiscovered),
        materials: recipe.materials,
        spell: recipe,
        isDiscovered: isDiscovered,
        isAvailable: canCast
      });
    }
    
    // Sort hints: available first, then discovered, then undiscovered
    hints.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.isDiscovered !== b.isDiscovered) return a.isDiscovered ? -1 : 1;
      return a.materials.length - b.materials.length; // Simpler spells first
    });
    
    return hints;
  }
  
  private generateHintDescription(recipe: SpellRecipe, currentMaterials: MaterialType[], isDiscovered: boolean): string {
    if (!isDiscovered) {
      // For undiscovered spells, give cryptic hints
      return this.generateCrypticHint(recipe);
    }
    
    if (SpellDatabase.canCastSpell(recipe.materials, currentMaterials)) {
      return `✓ ${recipe.name}: ${recipe.effect.description}`;
    }
    
    // For discovered but unavailable spells, show what's needed
    const needed = this.getMissingMaterials(recipe.materials, currentMaterials);
    const materialNames = needed.map(m => this.getMaterialName(m)).join(', ');
    return `Need: ${materialNames} → ${recipe.name}`;
  }
  
  private generateCrypticHint(recipe: SpellRecipe): string {
    const materialCount = recipe.materials.length;
    
    switch (recipe.id) {
      case 'strong_ember':
        return '??? Twin flames burn twice as bright...';
      case 'strong_vigor':
        return '??? Double nature\'s bounty...';
      case 'strong_shard':
        return '??? Two stones, stronger foundation...';
      case 'smoke_cloud':
        return '??? When fire meets leaf, concealment follows...';
      case 'molten_shard':
        return '??? Heat transforms earth...';
      case 'healing_stone':
        return '??? Nature\'s touch upon solid ground...';
      case 'inferno':
        return '??? Triple flames become an inferno...';
      case 'elemental_storm':
        return '??? All elements united in harmony...';
      case 'sanctuary':
        return '??? Nature and earth create sanctuary...';
      default:
        if (materialCount === 1) {
          return '??? A simple combination awaits...';
        } else if (materialCount === 2) {
          return '??? Two elements seek unity...';
        } else {
          return '??? Advanced magic requires mastery...';
        }
    }
  }
  
  private getMissingMaterials(required: MaterialType[], available: MaterialType[]): MaterialType[] {
    const missing: MaterialType[] = [];
    const availableCopy = [...available];
    
    for (const material of required) {
      const index = availableCopy.indexOf(material);
      if (index === -1) {
        missing.push(material);
      } else {
        availableCopy.splice(index, 1); // Remove used material
      }
    }
    
    return missing;
  }
  
  private getMaterialName(material: MaterialType): string {
    switch (material) {
      case MaterialType.FIRE: return 'Fire';
      case MaterialType.LEAF: return 'Leaf';
      case MaterialType.ROCK: return 'Rock';
      default: return 'Unknown';
    }
  }
  
  public showHints(currentMaterials: MaterialType[], x: number = 50, y: number = 150): void {
    this.hideHints(); // Clear existing hints
    
    const hints = this.generateHints(currentMaterials);
    this.hintContainer = this.scene.add.container(x, y);
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a1a, 0.95);
    bg.fillRoundedRect(0, 0, 300, Math.min(hints.length * 25 + 40, 400), 8);
    bg.lineStyle(2, 0x444444);
    bg.strokeRoundedRect(0, 0, 300, Math.min(hints.length * 25 + 40, 400), 8);
    this.hintContainer.add(bg);
    
    // Title
    const title = this.scene.add.text(150, 15, 'Recipe Hints', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.hintContainer.add(title);
    
    // Hints (show up to 12 to fit in container)
    const maxHints = 12;
    const visibleHints = hints.slice(0, maxHints);
    
    visibleHints.forEach((hint, index) => {
      const yPos = 40 + (index * 25);
      
      // Color based on status
      let color = '#666666'; // Undiscovered
      if (hint.isAvailable) color = '#00ff00'; // Available
      else if (hint.isDiscovered) color = '#cccccc'; // Discovered but unavailable
      
      const hintText = this.scene.add.text(10, yPos, hint.description, {
        fontSize: '10px',
        color: color,
        wordWrap: { width: 280 }
      });
      this.hintContainer.add(hintText);
      
      // Material icons for discovered spells
      if (hint.isDiscovered && hint.materials.length > 0) {
        hint.materials.forEach((material, matIndex) => {
          const iconX = 260 + (matIndex * 12);
          const icon = this.scene.add.graphics();
          icon.fillStyle(this.getMaterialColor(material));
          icon.fillCircle(iconX, yPos + 6, 4);
          
          // Add shape for accessibility
          icon.fillStyle(0x000000, 0.8);
          switch (material) {
            case MaterialType.FIRE:
              icon.fillTriangle(iconX, yPos + 3, iconX - 2, yPos + 8, iconX + 2, yPos + 8);
              break;
            case MaterialType.LEAF:
              icon.fillPoints([
                { x: iconX, y: yPos + 3 },
                { x: iconX + 2, y: yPos + 6 },
                { x: iconX, y: yPos + 9 },
                { x: iconX - 2, y: yPos + 6 }
              ]);
              break;
            case MaterialType.ROCK:
              icon.fillRect(iconX - 2, yPos + 4, 4, 4);
              break;
          }
          
          this.hintContainer.add(icon);
        });
      }
    });
    
    if (hints.length > maxHints) {
      const moreText = this.scene.add.text(150, 40 + (maxHints * 25), `... and ${hints.length - maxHints} more`, {
        fontSize: '10px',
        color: '#888888',
        fontStyle: 'italic'
      }).setOrigin(0.5, 0);
      this.hintContainer.add(moreText);
    }
    
    this.showingHints = true;
    
    // Auto-hide after 8 seconds
    this.scene.time.delayedCall(8000, () => {
      this.hideHints();
    });
  }
  
  private getMaterialColor(material: MaterialType): number {
    switch (material) {
      case MaterialType.FIRE: return 0xff4444;
      case MaterialType.LEAF: return 0x44ff44;
      case MaterialType.ROCK: return 0xffff44;
      default: return 0xffffff;
    }
  }
  
  public hideHints(): void {
    if (this.hintContainer) {
      this.hintContainer.destroy();
      this.hintContainer = null;
      this.showingHints = false;
    }
  }
  
  public toggleHints(currentMaterials: MaterialType[]): void {
    if (this.showingHints) {
      this.hideHints();
    } else {
      this.showHints(currentMaterials);
    }
  }
  
  public isShowingHints(): boolean {
    return this.showingHints;
  }
}