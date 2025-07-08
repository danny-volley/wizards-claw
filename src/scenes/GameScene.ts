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
  private globalSettleTimer: number = 0;
  private materialsAreFrozen: boolean = false;
  private lastMaterialDropTime: number = 0;
  
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
    this.spellArrow = new SpellArrow(this, 625, 250); // Position more to the left for wider spell window
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
    // Spell menu background - widened to accommodate descriptions
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x3a3a3a);
    menuBg.fillRoundedRect(640, 200, 150, 300, 10);
    menuBg.lineStyle(2, 0x555555);
    menuBg.strokeRoundedRect(640, 200, 150, 300, 10);
    
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
    // Clear existing spell graphics and texts, but preserve the spell arrow
    this.children.list.forEach(child => {
      if ((child instanceof Phaser.GameObjects.Text && child.x > 600) ||
          (child instanceof Phaser.GameObjects.Graphics && child.x > 600 && child.y > 190 && child !== this.spellArrow)) {
        child.destroy();
      }
    });
  }
  
  private drawAllSpells(spells: Array<{name: string, cost: MaterialType[], available: boolean}>) {
    this.clearSpellDisplay();
    
    spells.forEach((spell, index) => {
      const yPos = 250 + (index * 45); // 45px spacing
      this.drawSpellItem(spell, yPos, false); // false = not selection mode
    });
  }
  
  private drawSpellSelection(availableSpells: Array<{name: string, cost: MaterialType[], available: boolean}>, unavailableSpells: Array<{name: string, cost: MaterialType[], available: boolean}>) {
    this.clearSpellDisplay();
    
    let yPos = 250;
    
    // Draw available spells first
    availableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true); // true = selection mode
      yPos += 45;
    });
    
    // Draw unavailable spells at bottom (darkened)
    unavailableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true); // true = selection mode
      yPos += 45;
    });
    
    // Update spell arrow bounds (only for available spells)
    if (this.spellArrow) {
      this.spellArrow.setSpellCount(availableSpells.length);
      this.spellArrow.setSpellMenuBounds(250, availableSpells.length * 45);
    }
  }
  
  private drawSpellItem(spell: {name: string, cost: MaterialType[], available: boolean}, yPos: number, isSelectionMode: boolean) {
    // Determine colors and alpha based on availability and mode
    const bgColor = spell.available ? 0x4a4a4a : 0x2a2a2a;
    // During selection mode, darken text for unavailable spells; otherwise keep readable
    const textColor = (isSelectionMode && !spell.available) ? '#666666' : '#ffffff';
    const descColor = (isSelectionMode && !spell.available) ? '#555555' : '#cccccc';
    const alpha = spell.available ? 1.0 : (isSelectionMode ? 0.5 : 1.0);
    
    // Spell background - updated width to match menu
    const spellBg = this.add.graphics();
    spellBg.fillStyle(bgColor);
    spellBg.fillRoundedRect(650, yPos - 18, 130, 36, 5);
    if (!spell.available && isSelectionMode) {
      spellBg.setAlpha(alpha);
    }
    
    // Material cost area - centered on left side with padding
    const materialAreaX = 658; // 8px padding from left edge (650 + 8)
    const materialAreaWidth = 24; // Space for materials
    
    // Cost materials (colored circles) - stacked vertically on left side
    if (spell.cost.length > 0) {
      spell.cost.forEach((materialType, matIndex) => {
        const circle = this.add.graphics();
        const color = this.getMaterialColor(materialType);
        circle.fillStyle(color);
        
        // Stack materials vertically in the left area, centered horizontally
        const materialX = materialAreaX + (materialAreaWidth / 2); // Centered in material area
        const materialRadius = 5; // Increased from 4 to 5 (25% larger)
        
        // Calculate vertical positions - center around yPos for multiple materials
        const totalHeight = (spell.cost.length - 1) * 10; // 10px spacing between materials
        const startY = yPos - (totalHeight / 2);
        const materialY = startY + (matIndex * 10);
        
        circle.fillCircle(materialX, materialY, materialRadius);
        // Darken materials during selection mode if spell is unavailable
        if (isSelectionMode && !spell.available) {
          circle.setAlpha(0.4);
        }
      });
    } else {
      // Gather spell - show a special icon in material area
      const gatherIcon = this.add.graphics();
      const iconColor = (isSelectionMode && !spell.available) ? 0x444444 : 0x88ff88;
      gatherIcon.lineStyle(1.5, iconColor);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos - 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos + 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 8, yPos);
      // Darken icon during selection mode if spell is unavailable
      if (isSelectionMode && !spell.available) {
        gatherIcon.setAlpha(0.4);
      }
    }
    
    // Spell name - positioned to the right of materials
    const spellNameX = materialAreaX + materialAreaWidth + 4; // 4px gap after material area
    const spellText = this.add.text(spellNameX, yPos - 8, spell.name, {
      fontSize: '11px',
      color: textColor,
      fontStyle: 'bold'
    });
    
    // Spell description - below the name
    const description = this.getSpellDescription(spell.name);
    const descText = this.add.text(spellNameX, yPos + 4, description, {
      fontSize: '9px',
      color: descColor
    });
  }
  
  private getSpellDescription(spellName: string): string {
    switch(spellName) {
      case 'Attack': return 'Deal 3 damage';
      case 'Defend': return 'Block 2 damage';
      case 'Poison': return 'Poison for 2 turns';
      case 'Parry': return 'Counter-attack';
      case 'Gather': return 'Add 4 materials';
      default: return '';
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
    // Add collision between materials in the group with separation callback
    this.physics.add.collider(this.materialsGroup, this.materialsGroup, this.handleMaterialCollision, undefined, this);
    
    // Add collision between materials and bag walls
    this.physics.add.collider(this.materialsGroup, this.materialBag.getBagWalls());
  }
  
  private handleMaterialCollision(material1: Phaser.Physics.Arcade.Sprite, material2: Phaser.Physics.Arcade.Sprite) {
    // Skip collision handling if either object is being grabbed by crane
    if ((material1 as any).isBeingGrabbed || (material2 as any).isBeingGrabbed) {
      return;
    }
    
    // Wake up both objects from sleep
    this.wakeObject(material1);
    this.wakeObject(material2);
    
    const body1 = material1.body as Phaser.Physics.Arcade.Body;
    const body2 = material2.body as Phaser.Physics.Arcade.Body;
    
    const deltaX = material1.x - material2.x;
    const deltaY = material1.y - material2.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 0 && distance < 25) {
      const normalX = deltaX / distance;
      const normalY = deltaY / distance;
      const overlap = 25 - distance;
      
      // Apply separation force scaled by overlap
      const separationForce = overlap * 3;
      body1.setVelocityX(body1.velocity.x + normalX * separationForce);
      body2.setVelocityX(body2.velocity.x - normalX * separationForce);
      
      // Add horizontal sliding force to prevent sticking
      const slideForce = 15;
      body1.setVelocityX(body1.velocity.x + Math.sign(normalX) * slideForce);
      body2.setVelocityX(body2.velocity.x - Math.sign(normalX) * slideForce);
      
      // Vertical separation only if side-by-side
      if (Math.abs(normalY) < 0.7) {
        body1.setVelocityY(body1.velocity.y + normalY * separationForce * 0.5);
        body2.setVelocityY(body2.velocity.y - normalY * separationForce * 0.5);
      }
    }
  }
  
  public getMaterialsGroup(): Phaser.Physics.Arcade.Group {
    return this.materialsGroup;
  }
  
  private sleepObject(sprite: Phaser.Physics.Arcade.Sprite) {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    (sprite as any).isAsleep = true;
    (sprite as any).settlingTimer = 0;
  }
  
  private wakeObject(sprite: Phaser.Physics.Arcade.Sprite) {
    (sprite as any).isAsleep = false;
    (sprite as any).settlingTimer = 0;
  }
  
  public wakeAllMaterials() {
    // Wake all materials when something significant happens (like object removal)
    this.materialsGroup.children.entries.forEach((material) => {
      this.wakeObject(material as Phaser.Physics.Arcade.Sprite);
    });
  }
  
  private reenableAllPhysics() {
    // Re-enable physics for all materials
    this.materialsGroup.children.entries.forEach((material) => {
      const sprite = material as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (!body.enable) {
        body.setEnable(true);
      }
      this.wakeObject(sprite);
    });
    
    // Restart the settle timer after re-enabling physics
    this.lastMaterialDropTime = this.time.now;
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
    
    // Handle material dropped
    this.events.on('materialDropped', () => {
      this.lastMaterialDropTime = this.time.now;
      this.materialsAreFrozen = false;
      // Re-enable physics for all materials when new ones are added
      this.reenableAllPhysics();
    });
  }
  
  private handleMaterialGrabbed(material: Material) {
    console.log('Material grabbed:', material.materialType);
    
    // Unfreeze materials when crane picks something up
    this.materialsAreFrozen = false;
    console.log('Materials unfrozen - physics resumed');
    
    // Re-enable physics for all materials and wake them (this will restart the timer)
    this.reenableAllPhysics();
    
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
      // Unfreeze materials when new ones are added
      this.materialsAreFrozen = false;
      this.reenableAllPhysics(); // Re-enable physics (this will restart the timer)
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
    
    // Apply settling physics to materials (simple sleep system)
    this.updateMaterialSettling();
    
    // Global settle timer - freeze all materials after last drop
    if (!this.materialsAreFrozen && this.lastMaterialDropTime > 0) {
      const timeSinceLastDrop = this.time.now - this.lastMaterialDropTime;
      
      // Only freeze if crane is not active and enough time has passed
      if (timeSinceLastDrop > 3000 && !this.crane.isActive()) { // 3 seconds
        this.materialsAreFrozen = true;
        console.log('Materials frozen - all physics stopped');
      }
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
  
  private updateMaterialSettling() {
    // Proper sleep system - only stop objects that are truly at rest
    this.materialsGroup.children.entries.forEach((material) => {
      const sprite = material as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      
      if (body && body.enable) {
        const speed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
        
        // Initialize settling timer if not exists
        if (!(sprite as any).settlingTimer) {
          (sprite as any).settlingTimer = 0;
        }
        
        // Brute force: Stop everything after a few seconds
        if (this.materialsAreFrozen) {
          // Completely disable physics body when frozen
          if (body.enable) {
            body.setEnable(false);
            sprite.setPosition(sprite.x, sprite.y); // Lock position
          }
          return; // Skip all other physics processing
        } else {
          // Re-enable physics body if it was disabled
          if (!body.enable) {
            body.setEnable(true);
          }
        }
      }
    });
  }
}