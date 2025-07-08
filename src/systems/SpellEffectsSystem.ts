import { SpellRecipe, SpellEffect } from './SpellDatabase';

export interface ActiveEffect {
  id: string;
  name: string;
  type: 'damage' | 'healing' | 'utility' | 'defensive';
  value: number;
  duration: number;
  remainingTurns: number;
  area: 'single' | 'small' | 'large';
  effectMultiplier: number; // From timing accuracy
  description: string;
}

export interface SpellCastResult {
  success: boolean;
  spell: SpellRecipe;
  effectiveness: number;
  damage?: number;
  healing?: number;
  effects: ActiveEffect[];
  message: string;
}

export class SpellEffectsSystem {
  private scene: Phaser.Scene;
  private activeEffects: ActiveEffect[] = [];
  private effectId = 0;
  private twoMaterialSpellsCast = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public castSpell(spell: SpellRecipe, timingAccuracy: number): SpellCastResult {
    const effectMultiplier = 0.7 + (timingAccuracy * 0.3); // 70% to 100% effectiveness
    
    const result: SpellCastResult = {
      success: true,
      spell: spell,
      effectiveness: effectMultiplier,
      effects: [],
      message: `Cast ${spell.name} with ${(effectMultiplier * 100).toFixed(1)}% effectiveness`
    };
    
    // Apply spell effects based on type
    switch (spell.effect.type) {
      case 'damage':
        result.damage = Math.round(spell.effect.value * effectMultiplier);
        result.message = `${spell.name} deals ${result.damage} damage`;
        break;
        
      case 'healing':
        result.healing = Math.round(spell.effect.value * effectMultiplier);
        result.message = `${spell.name} heals ${result.healing} health`;
        break;
        
      case 'utility':
        result.message = `${spell.name} activated`;
        break;
        
      case 'defensive':
        result.message = `${spell.name} provides protection`;
        break;
    }
    
    // Add duration-based effects
    if (spell.effect.duration && spell.effect.duration > 0) {
      const activeEffect: ActiveEffect = {
        id: `effect_${this.effectId++}`,
        name: spell.name,
        type: spell.effect.type,
        value: Math.round(spell.effect.value * effectMultiplier),
        duration: spell.effect.duration,
        remainingTurns: spell.effect.duration,
        area: spell.effect.area || 'single',
        effectMultiplier: effectMultiplier,
        description: spell.effect.description
      };
      
      this.activeEffects.push(activeEffect);
      result.effects.push(activeEffect);
    }
    
    // Track 2-material spell progression for third slot unlock
    if (spell.materials.length === 2) {
      this.twoMaterialSpellsCast++;
      result.message += ` (2-material spells cast: ${this.twoMaterialSpellsCast}/3)`;
      
      // Unlock third slot after casting 3 different 2-material spells
      if (this.twoMaterialSpellsCast >= 3) {
        this.scene.events.emit('unlockThirdSlot');
      }
    }
    
    // Show visual effect
    this.showSpellEffect(spell, effectMultiplier);
    
    return result;
  }
  
  public updateEffects(): void {
    // Called each turn to update duration-based effects
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.remainingTurns--;
      
      if (effect.remainingTurns <= 0) {
        console.log(`Effect ${effect.name} expired`);
        return false; // Remove expired effect
      }
      
      return true; // Keep active effect
    });
  }
  
  public getActiveEffects(): ActiveEffect[] {
    return [...this.activeEffects];
  }
  
  public clearAllEffects(): void {
    this.activeEffects = [];
  }
  
  public getTwoMaterialSpellsCount(): number {
    return this.twoMaterialSpellsCast;
  }
  
  private showSpellEffect(spell: SpellRecipe, effectiveness: number): void {
    // Create visual effect based on spell type
    const effectContainer = this.scene.add.container(400, 200);
    
    // Base effect graphics
    const effect = this.scene.add.graphics();
    
    switch (spell.effect.type) {
      case 'damage':
        this.createDamageEffect(effect, spell, effectiveness);
        break;
        
      case 'healing':
        this.createHealingEffect(effect, spell, effectiveness);
        break;
        
      case 'utility':
        this.createUtilityEffect(effect, spell, effectiveness);
        break;
        
      case 'defensive':
        this.createDefensiveEffect(effect, spell, effectiveness);
        break;
    }
    
    effectContainer.add(effect);
    
    // Effect text
    const effectText = this.scene.add.text(0, 40, spell.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    effectContainer.add(effectText);
    
    // Effectiveness indicator
    const effectivenessColor = effectiveness > 0.9 ? '#00ff00' : effectiveness > 0.8 ? '#ffff00' : '#ff6600';
    const effectivenessText = this.scene.add.text(0, 55, `${(effectiveness * 100).toFixed(1)}%`, {
      fontSize: '12px',
      color: effectivenessColor
    }).setOrigin(0.5);
    effectContainer.add(effectivenessText);
    
    // Animate effect
    effectContainer.setScale(0);
    this.scene.tweens.add({
      targets: effectContainer,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: effectContainer,
          alpha: 0,
          duration: 500,
          delay: 500,
          onComplete: () => effectContainer.destroy()
        });
      }
    });
  }
  
  private createDamageEffect(graphics: Phaser.GameObjects.Graphics, spell: SpellRecipe, effectiveness: number): void {
    // Fire-based damage effect
    const intensity = Math.min(1.0, effectiveness * 1.2);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xff6600),
      Phaser.Display.Color.ValueToColor(0xff0000),
      1,
      intensity
    );
    
    graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    
    // Create flame-like effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 15 + (Math.random() * 10);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      graphics.fillCircle(x, y, 5 + Math.random() * 3);
    }
  }
  
  private createHealingEffect(graphics: Phaser.GameObjects.Graphics, spell: SpellRecipe, effectiveness: number): void {
    // Nature-based healing effect
    const intensity = Math.min(1.0, effectiveness * 1.2);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x44ff44),
      Phaser.Display.Color.ValueToColor(0x00ff00),
      1,
      intensity
    );
    
    graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    
    // Create leaf-like particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 20;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Draw leaf shape
      graphics.fillPoints([
        { x: x, y: y - 5 },
        { x: x + 5, y: y },
        { x: x, y: y + 5 },
        { x: x - 5, y: y }
      ]);
    }
  }
  
  private createUtilityEffect(graphics: Phaser.GameObjects.Graphics, spell: SpellRecipe, effectiveness: number): void {
    // Utility effects - sparkles and energy
    graphics.fillStyle(0x88ff88);
    
    for (let i = 0; i < 10; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 60;
      const size = 2 + Math.random() * 3;
      
      // Create star shape using fillPoints instead of fillStar
      const points = [];
      const numPoints = 4;
      for (let j = 0; j < numPoints * 2; j++) {
        const angle = (j * Math.PI) / numPoints;
        const radius = j % 2 === 0 ? size : size * 0.5;
        points.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius
        });
      }
      graphics.fillPoints(points);
    }
  }
  
  private createDefensiveEffect(graphics: Phaser.GameObjects.Graphics, spell: SpellRecipe, effectiveness: number): void {
    // Shield-like defensive effect
    const intensity = Math.min(1.0, effectiveness * 1.2);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x4444ff),
      Phaser.Display.Color.ValueToColor(0x0088ff),
      1,
      intensity
    );
    
    graphics.lineStyle(3, Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    
    // Create shield outline
    graphics.strokeCircle(0, 0, 25);
    graphics.strokeCircle(0, 0, 15);
    
    // Add protective runes
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 20;
      const y = Math.sin(angle) * 20;
      graphics.strokeRect(x - 3, y - 3, 6, 6);
    }
  }
}