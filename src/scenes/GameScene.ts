import Phaser from 'phaser';
import { InputSystem } from '../systems/InputSystem';
import { MaterialBag } from '../objects/MaterialBag';
import { MaterialSlots } from '../objects/MaterialSlots';
import { Crane } from '../objects/Crane';
import { Material, MaterialType } from '../objects/Material';
import { SpellArrow } from '../systems/SpellArrow';
import { SpellDatabase, SpellRecipe } from '../systems/SpellDatabase';
import { SpellEffectsSystem } from '../systems/SpellEffectsSystem';
import { RecipeHintSystem } from '../systems/RecipeHintSystem';
import { UIManager } from '../systems/UIManager';

export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private materialBag!: MaterialBag;
  private materialSlots!: MaterialSlots;
  private crane!: Crane;
  private spellArrow!: SpellArrow;
  private gameState: 'selecting' | 'casting' | 'processing' = 'selecting';
  private materialsGroup!: Phaser.Physics.Arcade.Group;
  private spellModeText: Phaser.GameObjects.Text | null = null;
  private availableSpells: SpellRecipe[] = [];
  private globalSettleTimer: number = 0;
  private materialsAreFrozen: boolean = false;
  private lastMaterialDropTime: number = 0;
  private spellEffectsSystem!: SpellEffectsSystem;
  private recipeHintSystem!: RecipeHintSystem;
  private uiManager!: UIManager;
  private spellWindowX!: number;
  private spellDisplayElements: Phaser.GameObjects.GameObject[] = []; // Track spell elements for clearing
  
  // Spell window dimensions - shared constants
  private readonly SPELL_WINDOW_WIDTH = 300;
  private readonly SPELL_WINDOW_PADDING = 20;
  private readonly SPELL_ITEM_WIDTH = this.SPELL_WINDOW_WIDTH - (this.SPELL_WINDOW_PADDING * 2);
  
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load UI assets
    this.load.image('background', 'src/assets/screens/wiz_screen_background.png');
    this.load.image('robe', 'src/assets/ui/wiz_ui_robe.png');
    this.load.image('bag', 'src/assets/ui/wiz_ui_bag.png');
    this.load.image('pouch', 'src/assets/ui/wiz_ui_pouch.png');
    this.load.image('scroll', 'src/assets/ui/wiz_ui_scroll.png');
    this.load.image('claw', 'src/assets/ui/wiz_ui_claw_materials.png');
    this.load.image('claw_spells', 'src/assets/ui/wiz_ui_claw_spells.png');
    
    // Load character assets
    this.load.image('char_burok', 'src/assets/characters/wiz_char_burok.png');
    this.load.image('char_yuvor', 'src/assets/characters/wiz_char_yuvor.png');
    
    console.log('GameScene: Loading UI assets');
  }

  create() {
    console.log('GameScene create() started');
    
    try {
      // Initialize spell database
      SpellDatabase.initialize();
      console.log('SpellDatabase initialized');
      
      // Set world bounds for new resolution
      this.physics.world.setBounds(0, 0, 1280, 720);
      console.log('World bounds set to 1280x720');
      
      // Initialize UI Manager
      this.uiManager = new UIManager(this);
      console.log('UIManager initialized');
      
      // Create background first
      this.uiManager.createBackground();
      
      // Create robe overlay (75% screen coverage, right-aligned)
      this.uiManager.createRobeOverlay();
      
      // Create materials group for collision management
      this.materialsGroup = this.physics.add.group();
      console.log('Materials group created');
      
      // Initialize input system
      this.inputSystem = new InputSystem(this);
      console.log('Input system created');
      
      // Initialize spell effects system
      this.spellEffectsSystem = new SpellEffectsSystem(this);
      console.log('Spell effects system created');
      
      // Initialize recipe hint system
      this.recipeHintSystem = new RecipeHintSystem(this);
      console.log('Recipe hint system created');
      
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
      
      // Add instructions - positioned for 1280x720
      this.add.text(640, 650, 'Press SPACEBAR to operate the crane', {
        fontSize: '20px',
        color: '#cccccc'
      }).setOrigin(0.5);
      
      this.add.text(640, 680, 'Press H to toggle recipe hints', {
        fontSize: '16px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      
      console.log('GameScene create() completed successfully');
    } catch (error) {
      console.error('Error in GameScene create():', error);
    }
  }
  
  private createGameLayout() {
    // Based on 1280x720 layout with new UI positioning
    
    // Create material bag using UIManager (center-bottom area)
    this.uiManager.createMaterialBag(640, 500);
    
    // Create material slots using UIManager (top of screen with padding)
    const topPadding = 60; // Padding from top of screen
    this.uiManager.createMaterialSlots(640, topPadding);
    
    // Create material slots (top of screen with padding)
    this.materialSlots = new MaterialSlots(this, 640, topPadding);
    
    // Create spell window using UIManager (right side with 3% padding from screen edge)
    const screenWidth = this.scale.width;
    const rightPadding = screenWidth * 0.03; // 3% of screen width
    this.spellWindowX = screenWidth - rightPadding - this.SPELL_WINDOW_WIDTH;
    this.uiManager.createSpellWindow(this.spellWindowX, 200);
    
    // TEMPORARILY HIDDEN - Create crane using UIManager (above bag)
    // this.uiManager.createCrane(640, 350);
    
    // Create character area (left side for combat)
    this.uiManager.createCharacterArea(200, 360);
    
    // Initialize existing systems with new positions
    this.materialBag = new MaterialBag(this, 640, 500);
    const bagBottomY = 500 + 60; // bag Y + half bag height
    this.crane = new Crane(this, 640, 350, bagBottomY);
    
    // Create spell selection system (positioned with spell window)
    this.spellArrow = new SpellArrow(this, this.spellWindowX, 360);
    this.createSpellMenu();
    
    // Create combat area placeholder (left side)
    this.createCombatArea();
  }
  
  
  private createCombatArea() {
    // Left side combat area placeholder - positioned for 1280x720
    const combatArea = this.add.container(200, 360);
    
    // Background
    const combatBg = this.add.graphics();
    combatBg.fillStyle(0x2a2a2a);
    combatBg.fillRoundedRect(-100, -100, 200, 200, 10);
    combatBg.lineStyle(2, 0x444444);
    combatBg.strokeRoundedRect(-100, -100, 200, 200, 10);
    combatArea.add(combatBg);
    
    // Player and enemy placeholders
    const playerText = this.add.text(0, 60, 'You', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    combatArea.add(playerText);
    
    const enemyText = this.add.text(0, -60, 'Slimy Toad', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    combatArea.add(enemyText);
  }
  
  private createSpellMenu() {
    // Spell menu background will be created dynamically in updateAvailableSpells
    // to match the number of spells
    
    // Update available spells based on current materials
    this.updateAvailableSpells();
  }
  
  private updateAvailableSpells() {
    // Get current materials in slots
    const materials = this.materialSlots.getFilledMaterials().map(m => m.materialType);
    
    if (this.gameState === 'selecting') {
      // During material selection: show all discovered spells with costs
      const allDiscoveredSpells = SpellDatabase.getDiscoveredRecipes();
      this.drawAllSpells(allDiscoveredSpells, materials);
    } else {
      // During spell selection: get available spells for casting
      const availableSpells = SpellDatabase.getAvailableSpells(materials);
      const allDiscoveredSpells = SpellDatabase.getDiscoveredRecipes();
      const unavailableSpells = allDiscoveredSpells.filter(spell => 
        !availableSpells.some(available => available.id === spell.id)
      );
      
      this.availableSpells = availableSpells;
      this.drawSpellSelection(availableSpells, unavailableSpells);
      
      // Update spell arrow with available spells for timing zones
      if (this.spellArrow) {
        this.spellArrow.setAvailableSpells(availableSpells);
      }
    }
  }
  
  private clearSpellDisplay() {
    // Clear all tracked spell elements
    this.spellDisplayElements.forEach(element => {
      if (element && element.active) {
        element.destroy();
      }
    });
    
    // Clear the tracking array
    this.spellDisplayElements = [];
    
    console.log(`Cleared ${this.spellDisplayElements.length} tracked spell display elements`);
  }
  
  private createDynamicSpellMenu(spellCount: number): number {
    // Calculate dynamic height based on number of spells
    const spellSpacing = 45;
    const topPadding = 40; // Space for any header
    const bottomPadding = 20;
    const menuHeight = topPadding + (spellCount * spellSpacing) + bottomPadding;
    
    // Ensure menu fits on screen (max height based on screen size)
    const maxHeight = 400; // Leave space for other UI elements
    const finalHeight = Math.min(menuHeight, maxHeight);
    
    // Adjust starting Y position if menu is too tall
    const menuStartY = 200;
    const menuEndY = menuStartY + finalHeight;
    const screenHeight = 600; // Game height
    
    let adjustedStartY = menuStartY;
    if (menuEndY > screenHeight - 50) { // 50px margin from bottom
      adjustedStartY = screenHeight - finalHeight - 50;
    }
    
    // TEMPORARILY HIDDEN - Create spell menu background
    // const menuBg = this.add.graphics();
    // menuBg.fillStyle(0x3a3a3a);
    // menuBg.fillRoundedRect(640, adjustedStartY, 150, finalHeight, 10);
    // menuBg.lineStyle(2, 0x555555);
    // menuBg.strokeRoundedRect(640, adjustedStartY, 150, finalHeight, 10);
    
    // Update scroll background to match spell window size
    this.uiManager.updateSpellWindowSize(this.SPELL_WINDOW_WIDTH, finalHeight, adjustedStartY);
    
    // Return the first spell Y position (menu start + top padding)
    return adjustedStartY + 30; // 30px from top of menu to first spell
  }
  
  private drawAllSpells(spells: SpellRecipe[], materials: MaterialType[]) {
    this.clearSpellDisplay();
    
    // Create dynamic spell menu background and get start Y position
    const startY = this.createDynamicSpellMenu(spells.length);
    
    spells.forEach((spell, index) => {
      const yPos = startY + (index * 45); // 45px spacing from dynamic start
      const available = SpellDatabase.canCastSpell(spell.materials, materials);
      this.drawSpellItem(spell, yPos, false, available); // false = not selection mode
    });
  }
  
  private drawSpellSelection(availableSpells: SpellRecipe[], unavailableSpells: SpellRecipe[]) {
    this.clearSpellDisplay();
    
    const totalSpells = availableSpells.length + unavailableSpells.length;
    
    // Create dynamic spell menu background and get start Y position
    const startY = this.createDynamicSpellMenu(totalSpells);
    
    let yPos = startY;
    
    // Draw available spells first
    availableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true, true); // true = selection mode, true = available
      yPos += 45;
    });
    
    // Draw unavailable spells at bottom (darkened)
    unavailableSpells.forEach((spell, index) => {
      this.drawSpellItem(spell, yPos, true, false); // true = selection mode, false = unavailable
      yPos += 45;
    });
    
    // Update spell arrow bounds (only for available spells)
    if (this.spellArrow) {
      this.spellArrow.setSpellCount(availableSpells.length);
      this.spellArrow.setSpellMenuBounds(startY, availableSpells.length * 45);
    }
  }
  
  private drawSpellItem(spell: SpellRecipe, yPos: number, isSelectionMode: boolean, available: boolean) {
    // Determine colors and alpha based on availability and mode
    const bgColor = available ? 0x4a4a4a : 0x2a2a2a;
    // Use black text for spell names and descriptions on the scroll background
    const textColor = (isSelectionMode && !available) ? '#666666' : '#000000';
    const descColor = (isSelectionMode && !available) ? '#555555' : '#333333';
    const alpha = available ? 1.0 : (isSelectionMode ? 0.3 : 1.0); // Much lower opacity for unavailable spells
    
    // Spell background - mostly transparent and fitting within scroll bounds
    const spellBg = this.add.graphics();
    spellBg.fillStyle(bgColor);
    spellBg.fillRoundedRect(this.spellWindowX + this.SPELL_WINDOW_PADDING, yPos - 18, this.SPELL_ITEM_WIDTH, 36, 5);
    spellBg.setAlpha(0.1); // Make mostly transparent
    if (!available && isSelectionMode) {
      spellBg.setAlpha(0.02); // Much more transparent for unavailable spells
    }
    this.spellDisplayElements.push(spellBg); // Track for clearing
    
    // Material cost area - centered on left side with padding
    const materialAreaX = this.spellWindowX + this.SPELL_WINDOW_PADDING + 8; // 8px padding from spell background edge
    const materialAreaWidth = 24; // Space for materials
    
    // Cost materials with colorblind-friendly shapes - first two stacked vertically, third on right
    if (spell.materials.length > 0) {
      spell.materials.forEach((materialType, matIndex) => {
        const materialIcon = this.add.graphics();
        const color = this.getMaterialColor(materialType);
        
        const materialRadius = 8; // Larger materials
        const padding = 3; // Reduced padding between materials
        
        let materialX, materialY;
        
        if (matIndex < 2) {
          // First two materials: stack vertically on left side
          materialX = materialAreaX + (materialAreaWidth / 2); // Centered in material area
          
          if (spell.materials.length === 1) {
            // Single material: center vertically
            materialY = yPos;
          } else {
            // Multiple materials: stack with padding, centered around yPos
            const totalHeight = (materialRadius * 2 * 2) + padding; // Height of two materials with padding
            const startY = yPos - (totalHeight / 2);
            materialY = startY + materialRadius + (matIndex * (materialRadius * 2 + padding));
          }
        } else {
          // Third material: positioned on the right, centered vertically
          materialX = materialAreaX + materialAreaWidth + materialRadius + 2; // To the right of the area
          materialY = yPos; // Centered vertically
        }
        
        // Draw base circle with material color
        materialIcon.fillStyle(color);
        materialIcon.fillCircle(materialX, materialY, materialRadius);
        
        // Add colorblind-friendly shape overlay
        materialIcon.fillStyle(0x000000, 0.8); // Semi-transparent black for contrast
        
        switch (materialType) {
          case MaterialType.FIRE:
            // Triangle pointing up (flame shape) - scaled for larger materials
            const size = 5; // Scaled for radius 8
            materialIcon.fillTriangle(
              materialX, materialY - size,     // top
              materialX - size, materialY + size,  // bottom left
              materialX + size, materialY + size   // bottom right
            );
            break;
            
          case MaterialType.LEAF:
            // Diamond/rhombus shape - scaled for larger materials
            const diamondSize = 4; // Scaled for radius 8
            materialIcon.fillPoints([
              { x: materialX, y: materialY - diamondSize },        // top
              { x: materialX + diamondSize, y: materialY },        // right
              { x: materialX, y: materialY + diamondSize },        // bottom
              { x: materialX - diamondSize, y: materialY }         // left
            ]);
            break;
            
          case MaterialType.ROCK:
            // Square shape - scaled for larger materials
            const squareSize = 4; // Scaled for radius 8
            materialIcon.fillRect(
              materialX - squareSize, 
              materialY - squareSize, 
              squareSize * 2, 
              squareSize * 2
            );
            break;
        }
        
        // Darken materials during selection mode if spell is unavailable
        if (isSelectionMode && !available) {
          materialIcon.setAlpha(0.2); // Much lower opacity for unavailable spells
        }
        
        // Track material icon for clearing
        this.spellDisplayElements.push(materialIcon);
      });
    } else {
      // Gather spell - show a special icon in material area
      const gatherIcon = this.add.graphics();
      const iconColor = (isSelectionMode && !available) ? 0x444444 : 0x88ff88;
      gatherIcon.lineStyle(1.5, iconColor);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos - 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 6, yPos + 3);
      gatherIcon.lineBetween(materialAreaX - 2, yPos, materialAreaX + 8, yPos);
      // Darken icon during selection mode if spell is unavailable
      if (isSelectionMode && !available) {
        gatherIcon.setAlpha(0.2); // Much lower opacity for unavailable spells
      }
      
      // Track gather icon for clearing
      this.spellDisplayElements.push(gatherIcon);
    }
    
    // Calculate available space for text layout
    const textStartX = materialAreaX + materialAreaWidth + 4; // 4px gap after material area
    const totalTextWidth = this.SPELL_ITEM_WIDTH - (textStartX - (this.spellWindowX + this.SPELL_WINDOW_PADDING));
    const nameWidth = Math.floor(totalTextWidth * 0.4); // 40% of available space for name
    const descWidth = Math.floor(totalTextWidth * 0.55); // 55% of available space for description (5% gap)
    
    // Spell name - positioned to the right of materials (left side)
    const spellText = this.add.text(textStartX, yPos, spell.name, {
      fontSize: '14px', // 30% bigger than 11px
      color: textColor,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: nameWidth, useAdvancedWrap: true }
    });
    spellText.setOrigin(0, 0.5); // Center vertically at yPos (middle of spell UI)
    if (isSelectionMode && !available) {
      spellText.setAlpha(alpha); // Apply lower opacity for unavailable spells
    }
    this.spellDisplayElements.push(spellText); // Track for clearing
    
    // Spell description - positioned to the right of name (right side)
    const descStartX = textStartX + nameWidth + 8; // 8px gap between name and description
    const descText = this.add.text(descStartX, yPos, spell.effect.description, {
      fontSize: '12px', // 30% bigger than 9px
      color: descColor,
      align: 'center',
      wordWrap: { width: descWidth, useAdvancedWrap: true }
    });
    descText.setOrigin(0, 0.5); // Center vertically at yPos (middle of spell UI)
    if (isSelectionMode && !available) {
      descText.setAlpha(alpha); // Apply lower opacity for unavailable spells
    }
    this.spellDisplayElements.push(descText); // Track for clearing
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
    
    if (distance > 0 && distance < 30) { // Updated for 14 radius materials (28 diameter + 2px buffer)
      const normalX = deltaX / distance;
      const normalY = deltaY / distance;
      const overlap = 30 - distance;
      
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
    
    // Handle third slot unlock
    this.events.on('unlockThirdSlot', () => {
      this.handleThirdSlotUnlock();
    });
    
    // Handle hint toggle
    this.events.on('toggleHints', () => {
      const currentMaterials = this.materialSlots.getFilledMaterials().map(m => m.materialType);
      this.recipeHintSystem.toggleHints(currentMaterials);
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
    
    // Check if slots are full for spell casting (minimum 2 slots, maximum available slots)
    const minSlotsForCasting = 2;
    const filledCount = this.materialSlots.getFilledCount();
    
    if (added && filledCount >= minSlotsForCasting && this.gameState === 'selecting') {
      // Check if user wants to continue adding materials or cast spell
      if (this.materialSlots.isThirdSlotUnlocked() && filledCount < 3) {
        // Third slot is unlocked but not full - show option to continue or cast
        console.log(`${filledCount} slots filled. You can add more materials or cast a spell.`);
        // For now, continue to material gathering - could add UI choice later
      } else if (this.materialSlots.isFull()) {
        // All available slots filled, switch to casting state
        console.log('SWITCHING TO SPELL SELECTION MODE - All slots filled');
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
  }
  
  private handleCraneActionComplete() {
    // Reset to selecting state if not full
    if (!this.materialSlots.isFull()) {
      this.gameState = 'selecting';
    }
  }
  
  private handleSpellSelection(spellName: string, timingAccuracy: number = 1.0) {
    console.log(`Selected spell: ${spellName} with ${(timingAccuracy * 100).toFixed(1)}% accuracy`);
    
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
    
    // Find the spell recipe for effects
    const spellRecipe = SpellDatabase.getDiscoveredRecipes().find(recipe => recipe.name === spellName);
    
    if (spellRecipe) {
      // Cast the spell with effects
      const castResult = this.spellEffectsSystem.castSpell(spellRecipe, timingAccuracy);
      console.log(castResult.message);
      
      // Show effects summary
      if (castResult.effects.length > 0) {
        castResult.effects.forEach(effect => {
          console.log(`Active effect: ${effect.name} for ${effect.remainingTurns} turns`);
        });
      }
    }
    
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
    
    // Note: Spell discovery happens in shop, not during combat
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
        const timingAccuracy = this.spellArrow.getTimingAccuracy();
        
        console.log('Selected spell:', selectedSpell.name);
        console.log('Timing accuracy:', timingAccuracy.toFixed(2));
        
        this.handleSpellSelection(selectedSpell.name, timingAccuracy);
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
  
  
  private handleThirdSlotUnlock() {
    const unlocked = this.materialSlots.unlockThirdSlot();
    
    if (unlocked) {
      // Show unlock notification
      const notification = this.add.container(400, 200);
      
      // Background
      const notificationBg = this.add.graphics();
      notificationBg.fillStyle(0x000000, 0.8);
      notificationBg.fillRoundedRect(-150, -40, 300, 80, 10);
      notificationBg.lineStyle(3, 0x00ff00);
      notificationBg.strokeRoundedRect(-150, -40, 300, 80, 10);
      notification.add(notificationBg);
      
      // Title
      const titleText = this.add.text(0, -15, 'THIRD SLOT UNLOCKED!', {
        fontSize: '16px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      notification.add(titleText);
      
      // Description
      const descText = this.add.text(0, 10, 'You can now use 3 materials for powerful spells!', {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0.5);
      notification.add(descText);
      
      // Animate notification
      notification.setScale(0);
      this.tweens.add({
        targets: notification,
        scale: 1,
        duration: 400,
        ease: 'Back.easeOut'
      });
      
      // Auto-hide after 4 seconds
      this.time.delayedCall(4000, () => {
        this.tweens.add({
          targets: notification,
          scale: 0,
          alpha: 0,
          duration: 300,
          ease: 'Power2.easeIn',
          onComplete: () => notification.destroy()
        });
      });
    }
  }
}