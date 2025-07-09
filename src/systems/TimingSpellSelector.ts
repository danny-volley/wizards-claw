import { SpellRecipe } from './SpellDatabase';

export enum TimingQuality {
  BONUS = 'bonus',
  NORMAL = 'normal',
  REDUCED = 'reduced'
}

export interface TimingResult {
  quality: TimingQuality;
  modifier: number; // 1.2 for bonus, 1.0 for normal, 0.8 for reduced
}

export interface TimingWindow {
  startPercent: number;
  endPercent: number;
  quality: TimingQuality;
  color: number;
}

export class TimingSpellSelector {
  private scene: Phaser.Scene;
  private spellRecipes: SpellRecipe[];
  private currentSpellIndex: number = 0;
  private timingBars: Phaser.GameObjects.Graphics[] = [];
  private timingIndicator: Phaser.GameObjects.Graphics | null = null;
  private timingTween: Phaser.Tweens.Tween | null = null;
  private currentTimingPercent: number = 0;
  private isActive: boolean = false;
  private spellWindowX: number = 0;
  private spellStartY: number = 0;
  
  // Visual constants
  private readonly BAR_WIDTH = 16; // Made a bit thinner
  private readonly BAR_HEIGHT = 36; // Match spell item height
  private readonly BAR_GAP = 10; // Gap from spell window
  private readonly COLORS = {
    BONUS: 0x00FF00,    // Green
    NORMAL: 0xFFFF00,   // Yellow
    REDUCED: 0xFF0000,  // Red
    INDICATOR: 0x00FFFF // Cyan
  };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.spellRecipes = [];
  }
  
  public startTimingSelection(spells: SpellRecipe[], spellWindowX: number, spellStartY: number): void {
    this.spellRecipes = spells;
    this.spellWindowX = spellWindowX;
    this.spellStartY = spellStartY;
    this.isActive = true;
    
    this.createTimingBars();
    // No separate animation - timing is based on spell arrow position
  }
  
  private createTimingBars(): void {
    // Clear existing bars
    this.clearTimingBars();
    
    this.spellRecipes.forEach((spell, index) => {
      const timingWindows = this.getTimingWindows(spell);
      const yPosition = this.getSpellYPosition(index);
      const xPosition = this.getTimingBarXPosition();
      
      const bar = this.scene.add.graphics();
      bar.setDepth(999); // High depth to appear above other elements
      
      // Draw timing segments
      timingWindows.forEach(window => {
        const segmentHeight = this.BAR_HEIGHT * (window.endPercent - window.startPercent) / 100;
        const segmentY = yPosition - (this.BAR_HEIGHT / 2) + (this.BAR_HEIGHT * window.startPercent / 100);
        
        bar.fillStyle(window.color);
        bar.fillRect(xPosition, segmentY, this.BAR_WIDTH, segmentHeight);
      });
      
      // Add border
      bar.lineStyle(2, 0x584040);
      bar.strokeRect(xPosition, yPosition - (this.BAR_HEIGHT / 2), this.BAR_WIDTH, this.BAR_HEIGHT);
      
      this.timingBars.push(bar);
    });
    
    // Timing bars are now ready - no separate indicator needed
  }
  
  // Timing indicator is now handled by the spell arrow position
  
  private getSpellYPosition(index: number): number {
    // Calculate position based on spell list layout
    const spellItemHeight = 45;
    return this.spellStartY + (index * spellItemHeight);
  }

  private getTimingBarXPosition(): number {
    // Position timing bars to the left side inside the spell window
    const spellWindowPadding = 10; // SPELL_WINDOW_PADDING from GameScene
    return this.spellWindowX + spellWindowPadding;
  }
  
  private getTimingWindows(spell: SpellRecipe): TimingWindow[] {
    const materialCount = spell.materials.length;
    
    if (materialCount === 0) {
      // Gather spell: mostly yellow with small green in middle, no red
      return [
        { startPercent: 0, endPercent: 35, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL },
        { startPercent: 35, endPercent: 65, quality: TimingQuality.BONUS, color: this.COLORS.BONUS },
        { startPercent: 65, endPercent: 100, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL }
      ];
    } else if (materialCount === 1) {
      // 1 material: mostly yellow with small green in middle
      return [
        { startPercent: 0, endPercent: 35, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL },
        { startPercent: 35, endPercent: 65, quality: TimingQuality.BONUS, color: this.COLORS.BONUS },
        { startPercent: 65, endPercent: 100, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL }
      ];
    } else if (materialCount === 2) {
      // 2 materials: top area mostly yellow, small green section, red at bottom
      return [
        { startPercent: 0, endPercent: 60, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL },
        { startPercent: 60, endPercent: 75, quality: TimingQuality.BONUS, color: this.COLORS.BONUS },
        { startPercent: 75, endPercent: 100, quality: TimingQuality.REDUCED, color: this.COLORS.REDUCED }
      ];
    } else {
      // 3+ materials: even smaller green, less yellow, more red
      return [
        { startPercent: 0, endPercent: 15, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL },
        { startPercent: 15, endPercent: 30, quality: TimingQuality.BONUS, color: this.COLORS.BONUS },
        { startPercent: 30, endPercent: 60, quality: TimingQuality.NORMAL, color: this.COLORS.NORMAL },
        { startPercent: 60, endPercent: 100, quality: TimingQuality.REDUCED, color: this.COLORS.REDUCED }
      ];
    }
  }
  
  public selectCurrentSpell(arrowY: number): TimingResult | null {
    if (!this.isActive || this.currentSpellIndex >= this.spellRecipes.length) {
      return null;
    }
    
    const spell = this.spellRecipes[this.currentSpellIndex];
    const timingWindows = this.getTimingWindows(spell);
    
    // Convert arrow Y position to timing percentage for current spell
    const spellY = this.getSpellYPosition(this.currentSpellIndex);
    const relativeY = arrowY - (spellY - this.BAR_HEIGHT / 2);
    const timingPercent = (relativeY / this.BAR_HEIGHT) * 100;
    
    // Find which window the current timing falls into
    for (const window of timingWindows) {
      if (timingPercent >= window.startPercent && 
          timingPercent < window.endPercent) {
        
        let modifier = 1.0;
        switch (window.quality) {
          case TimingQuality.BONUS:
            modifier = 1.2; // 20% bonus
            break;
          case TimingQuality.REDUCED:
            modifier = 0.5; // 50% decrease
            break;
          default:
            modifier = 1.0; // Normal
        }
        
        return {
          quality: window.quality,
          modifier: modifier
        };
      }
    }
    
    // Default to normal if no window found
    return {
      quality: TimingQuality.NORMAL,
      modifier: 1.0
    };
  }
  
  public setCurrentSpell(index: number): void {
    if (index >= 0 && index < this.spellRecipes.length) {
      this.currentSpellIndex = index;
    }
  }
  
  public stop(): void {
    this.isActive = false;
    this.clearTimingBars();
  }
  
  private clearTimingBars(): void {
    this.timingBars.forEach(bar => bar.destroy());
    this.timingBars = [];
  }
  
  public isTimingActive(): boolean {
    return this.isActive;
  }
}