import Phaser from 'phaser';
import { InputSystem } from '../systems/InputSystem';
import { MaterialBag } from '../objects/MaterialBag';
import { MaterialSlots } from '../objects/MaterialSlots';
import { Crane } from '../objects/Crane';
import { Material, MaterialType } from '../objects/Material';
import { SpellArrow } from '../systems/SpellArrow';

export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private materialBag!: MaterialBag;
  private materialSlots!: MaterialSlots;
  private crane!: Crane;
  private spellArrow!: SpellArrow;
  private gameState: 'selecting' | 'casting' | 'processing' = 'selecting';
  private materialsGroup!: Phaser.Physics.Arcade.Group;
  private spellModeText: Phaser.GameObjects.Text | null = null;
  private availableSpells: string[] = [];
  
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Assets will be created programmatically
  }

  create() {
    console.log('GameScene create() started');
    
    try {
      // Set world bounds
      this.physics.world.setBounds(0, 0, 800, 600);
      console.log('World bounds set');
      
      // Create materials group for collision management
      this.materialsGroup = this.physics.add.group();
      console.log('Materials group created');
      
      // Initialize input system
      this.inputSystem = new InputSystem(this);
      console.log('Input system created');
      
      // Create main game areas based on mockup layout
      this.createGameLayout();
      console.log('Game layout created');
      
      // Set up physics collisions
      this.setupPhysics();
      console.log('Physics setup complete');
      
      // Set up event listeners
      this.setupEventHandlers();
      console.log('Event handlers setup');
      
      // Initial game state
      this.gameState = 'selecting';
      
      // Add instructions
      this.add.text(400, 550, 'Press SPACEBAR to operate the crane', {
        fontSize: '16px',
        color: '#cccccc'
      }).setOrigin(0.5);
      
      console.log('GameScene create() completed successfully');
    } catch (error) {
      console.error('Error in GameScene create():', error);
    }
  }
  
  private createGameLayout() {
    // Based on mockup: Left side is combat area, center is crane/bag, right is spell menu
    
    // Create material bag (center-bottom)
    this.materialBag = new MaterialBag(this, 400, 350);
    
    // Create material slots (center-top)
    this.materialSlots = new MaterialSlots(this, 400, 150);
    
    // Create crane (above bag) - pass bag bottom Y position
    const bagBottomY = 350 + 60; // bag Y + half bag height
    this.crane = new Crane(this, 400, 200, bagBottomY);
    
    // Create spell selection system  
    this.spellArrow = new SpellArrow(this, 635, 250); // Position more to the left so it's not behind the spell window
    this.createSpellMenu();
    
    // Create combat area placeholder (left side)
    this.createCombatArea();
  }
  
  
  private createCombatArea() {
    // Left side combat area placeholder
    const combatArea = this.add.container(100, 300);
    
    // Background
    const combatBg = this.add.graphics();
    combatBg.fillStyle(0x2a2a2a);
    combatBg.fillRoundedRect(0, 0, 200, 200, 10);
    combatBg.lineStyle(2, 0x444444);
    combatBg.strokeRoundedRect(0, 0, 200, 200, 10);
    combatArea.add(combatBg);
    
    // Player and enemy placeholders
    const playerText = this.add.text(100, 160, 'You', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    combatArea.add(playerText);
    
    const enemyText = this.add.text(100, 40, 'Slimy Toad', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    combatArea.add(enemyText);
  }
  
  private createSpellMenu() {
    // Spell menu background
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x3a3a3a);
    menuBg.fillRoundedRect(650, 200, 120, 300, 10);
    menuBg.lineStyle(2, 0x555555);
    menuBg.strokeRoundedRect(650, 200, 120, 300, 10);
    
    // Update available spells based on current materials
    this.updateAvailableSpells();
  }
  
  private updateAvailableSpells() {
    // Get current materials in slots
    const materials = this.materialSlots.getFilledMaterials().map(m => m.materialType);
    
    // Always show all spells, but determine which are available
    const allSpells = [
      { name: 'Attack', cost: [MaterialType.FIRE], available: materials.includes(MaterialType.FIRE) },
      { name: 'Defend', cost: [MaterialType.LEAF], available: materials.includes(MaterialType.LEAF) },
      { name: 'Poison', cost: [MaterialType.ROCK], available: materials.includes(MaterialType.ROCK) },
      { name: 'Parry', cost: [MaterialType.FIRE, MaterialType.LEAF], available: materials.includes(MaterialType.FIRE) && materials.includes(MaterialType.LEAF) },
      { name: 'Gather', cost: [], available: true } // Always available
    ];
    
    if (this.gameState === 'selecting') {
      // During material selection: show all spells with costs
      this.drawAllSpells(allSpells);
    } else {
      // During spell selection: separate available/unavailable
      const availableSpells = allSpells.filter(spell => spell.available);
      const unavailableSpells = allSpells.filter(spell => !spell.available);
      this.availableSpells = availableSpells.map(spell => spell.name);
      this.drawSpellSelection(availableSpells, unavailableSpells);
    }
  }
  
  private clearSpellDisplay() {
    // Clear existing spell graphics and texts
    this.children.list.forEach(child => {
      if ((child instanceof Phaser.GameObjects.Text && child.x > 600) ||
          (child instanceof Phaser.GameObjects.Graphics && child.x > 600 && child.y > 190)) {
        child.destroy();
      }
    });
  }
  
  private drawAllSpells(spells: Array<{name: string, cost: MaterialType[], available: boolean}>) {
    this.clearSpellDisplay();
    
    spells.forEach((spell, index) => {
      const yPos = 250 + (index * 45); // 45px spacing
      
      // Spell background
      const spellBg = this.add.graphics();
      spellBg.fillStyle(spell.available ? 0x4a4a4a : 0x2a2a2a);
      spellBg.fillRoundedRect(660, yPos - 18, 100, 36, 5);
      
      // Spell name
      this.add.text(665, yPos - 5, spell.name, {
        fontSize: '12px',
        color: spell.available ? '#ffffff' : '#666666'
      });
      
      // Cost materials (colored circles)
      if (spell.cost.length > 0) {
        spell.cost.forEach((materialType, matIndex) => {
          const circle = this.add.graphics();
          const color = this.getMaterialColor(materialType);
          circle.fillStyle(color);
          circle.fillCircle(665 + (matIndex * 12), yPos + 8, 4);
          if (!spell.available) {
            circle.setAlpha(0.4);
          }
        });
      } else {
        // Gather - no icon needed, just text
      }
    });
  }
  
  private drawSpellSelection(availableSpells: Array<{name: string, cost: MaterialType[], available: boolean}>, unavailableSpells: Array<{name: string, cost: MaterialType[], available: boolean}>) {
    this.clearSpellDisplay();
    
    let yPos = 250;
    
    // Draw available spells first
    availableSpells.forEach((spell, index) => {
      // Spell background
      const spellBg = this.add.graphics();
      spellBg.fillStyle(0x4a4a4a);
      spellBg.fillRoundedRect(660, yPos - 18, 100, 36, 5);
      
      // Spell name
      this.add.text(710, yPos, spell.name, {
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      yPos += 45;
    });
    
    // Draw unavailable spells at bottom (darkened)
    unavailableSpells.forEach((spell, index) => {
      // Spell background (darker)
      const spellBg = this.add.graphics();
      spellBg.fillStyle(0x1a1a1a);
      spellBg.fillRoundedRect(660, yPos - 18, 100, 36, 5);
      spellBg.setAlpha(0.5);
      
      // Spell name (grayed out)
      this.add.text(710, yPos, spell.name, {
        fontSize: '14px',
        color: '#444444'
      }).setOrigin(0.5);
      
      yPos += 45;
    });
    
    // Update spell arrow bounds (only for available spells)
    if (this.spellArrow) {
      this.spellArrow.setSpellCount(availableSpells.length);
      this.spellArrow.setSpellMenuBounds(250, availableSpells.length * 45);
    }
  }
  
  private getMaterialColor(type: MaterialType): number {
    switch(type) {
      case MaterialType.FIRE: return 0xff4444;
      case MaterialType.LEAF: return 0x44ff44;
      case MaterialType.ROCK: return 0xffff44;
      default: return 0xffffff;
    }
  }
  
  private setupPhysics() {
    // Add collision between materials in the group (for stacking)
    this.physics.add.collider(this.materialsGroup, this.materialsGroup);
    
    // Add collision between materials and bag walls
    this.physics.add.collider(this.materialsGroup, this.materialBag.getBagWalls());
  }
  
  public getMaterialsGroup(): Phaser.Physics.Arcade.Group {
    return this.materialsGroup;
  }
  
  private setupEventHandlers() {
    // Handle material grabbed by crane
    this.events.on('materialGrabbed', (material: Material) => {
      this.handleMaterialGrabbed(material);
    });
    
    // Handle crane action complete
    this.events.on('craneActionComplete', () => {
      this.handleCraneActionComplete();
    });
  }
  
  private handleMaterialGrabbed(material: Material) {
    console.log('Material grabbed:', material.materialType);
    
    // Remove material from bag
    this.materialBag.removeMaterial(material);
    
    // Add to slots
    const added = this.materialSlots.addMaterial(material);
    console.log('Material added to slot:', added);
    console.log('Slots filled count:', this.materialSlots.getFilledCount());
    console.log('Is full:', this.materialSlots.isFull());
    
    if (added && this.materialSlots.isFull() && this.gameState === 'selecting') {
      // Both slots filled, switch to casting state
      console.log('SWITCHING TO SPELL SELECTION MODE');
      this.gameState = 'casting';
      this.crane.stopSwinging();
      
      // Update available spells and start spell selection
      this.updateAvailableSpells();
      console.log('Starting spell selection arrow');
      this.spellArrow.startSelection();
      
      // Add visual indicator (only once)
      if (!this.spellModeText) {
        this.spellModeText = this.add.text(400, 100, 'SPELL SELECTION - Press SPACEBAR', {
          fontSize: '16px',
          color: '#ffff00'
        }).setOrigin(0.5);
      }
    }
  }
  
  private handleCraneActionComplete() {
    // Reset to selecting state if not full
    if (!this.materialSlots.isFull()) {
      this.gameState = 'selecting';
    }
  }
  
  private handleSpellSelection(spellName: string) {
    console.log(`Selected spell: ${spellName}`);
    
    // Stop spell selection
    console.log('Stopping spell selection arrow');
    this.spellArrow.stopSelection();
    
    // Clear visual indicator
    if (this.spellModeText) {
      this.spellModeText.destroy();
      this.spellModeText = null;
    }
    
    // Get materials from slots before clearing them
    const usedMaterials = this.materialSlots.getFilledMaterials();
    
    // Destroy the used materials (make them disappear)
    usedMaterials.forEach(material => {
      if (material) {
        material.destroy();
      }
    });
    
    // Clear slots and return to material selection
    this.materialSlots.clear();
    this.gameState = 'selecting';
    this.crane.resumeSwinging();
    
    // Reset spell menu to show all spells
    this.updateAvailableSpells();
    
    // Handle Gather action
    if (spellName === 'Gather') {
      this.materialBag.addGatherMaterials(4);
    }
  }
  

  update() {
    this.inputSystem.update();
    
    // Update crane movement (only when selecting materials)
    if (this.gameState === 'selecting') {
      this.crane.update();
    }
    
    // Update spell arrow (only when casting spells)
    if (this.gameState === 'casting') {
      this.spellArrow.update();
    }
    
    // Handle input based on current state
    if (this.gameState === 'selecting' && this.inputSystem.hasUnprocessedInput()) {
      this.inputSystem.consumeInput();
      
      if (!this.crane.isActive()) {
        this.crane.startDescent();
      }
    }
    
    // Handle spell casting input
    if (this.gameState === 'casting' && this.inputSystem.hasUnprocessedInput()) {
      this.inputSystem.consumeInput();
      
      const selectedSpellIndex = this.spellArrow.getCurrentSpellIndex();
      if (selectedSpellIndex >= 0 && selectedSpellIndex < this.availableSpells.length) {
        const selectedSpell = this.availableSpells[selectedSpellIndex];
        console.log('Selected spell:', selectedSpell);
        this.handleSpellSelection(selectedSpell);
      }
    }
  }
}