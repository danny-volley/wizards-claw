import { MaterialType } from '../objects/Material';

export interface Spell {
  name: string;
  materials: MaterialType[];
  available: boolean;
}

export class SpellSelector extends Phaser.GameObjects.Container {
  private spells: Spell[] = [];
  private availableSpells: Spell[] = [];
  private unavailableSpells: Spell[] = [];
  private currentSelection: number = 0;
  private arrow: Phaser.GameObjects.Graphics;
  private arrowSpeed: number = 0.03;
  private arrowDirection: number = 1;
  private isActive: boolean = false;
  private gameScene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    // Store scene reference
    this.gameScene = scene;
    
    // Add to scene first
    scene.add.existing(this);
    
    this.initializeSpells();
    this.createArrow();
    this.createSpellMenu();
  }
  
  private initializeSpells() {
    this.spells = [
      { name: 'Attack', materials: [MaterialType.FIRE], available: false },
      { name: 'Defend', materials: [MaterialType.LEAF], available: false },
      { name: 'Poison', materials: [MaterialType.ROCK], available: false },
      { name: 'Parry', materials: [MaterialType.FIRE, MaterialType.LEAF], available: false },
      { name: 'Gather', materials: [], available: true } // Always available
    ];
  }
  
  private createArrow() {
    this.arrow = this.gameScene.add.graphics();
    this.arrow.fillStyle(0xffffff);
    this.arrow.fillTriangle(-8, 0, 0, -6, 0, 6);
    this.add(this.arrow);
    
    this.arrow.setVisible(false);
  }
  
  private createSpellMenu() {
    // Clear existing menu
    this.removeAll(true);
    this.add(this.arrow);
    
    // Menu background
    const menuBg = this.gameScene.add.graphics();
    menuBg.fillStyle(0x3a3a3a);
    menuBg.fillRoundedRect(0, 0, 120, 300, 10);
    menuBg.lineStyle(2, 0x555555);
    menuBg.strokeRoundedRect(0, 0, 120, 300, 10);
    this.add(menuBg);
    
    // Separate available and unavailable spells
    this.availableSpells = this.spells.filter(spell => spell.available);
    this.unavailableSpells = this.spells.filter(spell => !spell.available);
    
    // Display spells
    let yOffset = 30;
    
    // Available spells first
    this.availableSpells.forEach((spell, index) => {
      this.createSpellDisplay(spell, yOffset, true);
      yOffset += 40;
    });
    
    // Unavailable spells (grayed out)
    this.unavailableSpells.forEach((spell, index) => {
      this.createSpellDisplay(spell, yOffset, false);
      yOffset += 40;
    });
    
    // Position arrow at first available spell
    if (this.availableSpells.length > 0) {
      this.currentSelection = 0;
      this.updateArrowPosition();
    }
  }
  
  private createSpellDisplay(spell: Spell, yPos: number, available: boolean) {
    const alpha = available ? 1 : 0.4;
    const textColor = available ? '#ffffff' : '#666666';
    
    // Spell background
    const spellBg = this.gameScene.add.graphics();
    spellBg.fillStyle(available ? 0x4a4a4a : 0x2a2a2a);
    spellBg.fillRoundedRect(10, yPos, 100, 30, 5);
    spellBg.setAlpha(alpha);
    this.add(spellBg);
    
    // Spell materials (colored circles)
    if (spell.materials.length > 0) {
      spell.materials.forEach((materialType, matIndex) => {
        const circle = this.gameScene.add.graphics();
        const color = this.getMaterialColor(materialType);
        circle.fillStyle(color);
        circle.fillCircle(20 + (matIndex * 15), yPos + 15, 6);
        circle.setAlpha(alpha);
        this.add(circle);
      });
    } else {
      // Gather icon (arrow)
      const gatherIcon = this.gameScene.add.graphics();
      gatherIcon.lineStyle(2, available ? 0xffffff : 0x666666);
      gatherIcon.lineBetween(15, yPos + 15, 25, yPos + 10);
      gatherIcon.lineBetween(15, yPos + 15, 25, yPos + 20);
      gatherIcon.lineBetween(15, yPos + 15, 30, yPos + 15);
      gatherIcon.setAlpha(alpha);
      this.add(gatherIcon);
    }
    
    // Spell name
    const spellText = this.gameScene.add.text(50, yPos + 15, spell.name, {
      fontSize: '12px',
      color: textColor
    }).setOrigin(0, 0.5);
    spellText.setAlpha(alpha);
    this.add(spellText);
  }
  
  private getMaterialColor(type: MaterialType): number {
    switch(type) {
      case MaterialType.FIRE: return 0xff4444;
      case MaterialType.LEAF: return 0x44ff44;
      case MaterialType.ROCK: return 0xffff44;
      default: return 0xffffff;
    }
  }
  
  public updateAvailableSpells(selectedMaterials: MaterialType[]) {
    // Reset availability
    this.spells.forEach(spell => {
      if (spell.name === 'Gather') {
        spell.available = true;
        return;
      }
      
      // Check if spell can be cast with selected materials
      if (spell.materials.length === 0) {
        spell.available = true;
      } else if (spell.materials.length === 1) {
        spell.available = selectedMaterials.includes(spell.materials[0]);
      } else {
        // For combination spells, check if all required materials are available
        spell.available = spell.materials.every(required => 
          selectedMaterials.includes(required)
        );
      }
    });
    
    this.createSpellMenu();
  }
  
  public startSelection() {
    this.isActive = true;
    this.arrow.setVisible(true);
    this.currentSelection = 0;
    this.updateArrowPosition();
  }
  
  public stopSelection() {
    this.isActive = false;
    this.arrow.setVisible(false);
  }
  
  public update() {
    if (!this.isActive || this.availableSpells.length === 0) return;
    
    // Move arrow up and down through available spells
    this.currentSelection += this.arrowDirection * this.arrowSpeed;
    
    // Bounce between available spells
    if (this.currentSelection >= this.availableSpells.length - 1) {
      this.currentSelection = this.availableSpells.length - 1;
      this.arrowDirection = -1;
    } else if (this.currentSelection <= 0) {
      this.currentSelection = 0;
      this.arrowDirection = 1;
    }
    
    this.updateArrowPosition();
  }
  
  private updateArrowPosition() {
    if (this.availableSpells.length === 0) return;
    
    const currentIndex = Math.floor(this.currentSelection);
    const yPos = 30 + (currentIndex * 40) + 15; // Center of spell option
    this.arrow.setPosition(-15, yPos);
  }
  
  public selectCurrentSpell(): Spell | null {
    if (!this.isActive || this.availableSpells.length === 0) return null;
    
    const selectedIndex = Math.floor(this.currentSelection);
    if (selectedIndex >= 0 && selectedIndex < this.availableSpells.length) {
      return this.availableSpells[selectedIndex];
    }
    
    return null;
  }
  
  public getCurrentSpellName(): string {
    const spell = this.selectCurrentSpell();
    return spell ? spell.name : '';
  }
}